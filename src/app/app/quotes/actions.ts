'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function createQuoteAction(
    companyId: string,
    clientId: string,
    items: any[],
    data: any
) {
    const supabase = await createClient()
    const { data: userResponse } = await supabase.auth.getUser()

    if (!userResponse.user) {
        return { error: 'Não autenticado.' }
    }

    // Calculate totals
    let subtotal = 0
    let discount_total = parseFloat(data.discount_total || '0')
    let tax_total = parseFloat(data.tax_total || '0')
    let shipping_total = parseFloat(data.shipping_total || '0')

    for (const item of items) {
        subtotal += (item.qty * item.unit_price) - (item.discounts || 0)
        tax_total += (item.taxes || 0)
    }

    const total = subtotal - discount_total + tax_total + shipping_total

    // 1. Insert Quote
    const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert([
            {
                company_id: companyId,
                client_id: clientId,
                status: data.status || 'draft',
                valid_until: data.valid_until || null,
                subtotal,
                discount_total,
                tax_total,
                shipping_total,
                total,
                payment_terms: data.payment_terms,
                delivery_time: data.delivery_time,
                freight_type: data.freight_type,
                carrier: data.carrier,
                notes_commercial: data.notes_commercial,
                notes_fiscal: data.notes_fiscal,
                created_by: userResponse.user.id,
            },
        ])
        .select()
        .single()

    if (quoteError) {
        console.error('Quote creation error:', quoteError)
        return { error: 'Erro ao criar orçamento.' }
    }

    // 2. Insert Items
    const quoteItemsData = items.map(item => ({
        quote_id: quoteData.id,
        product_id: item.product_id || null,
        name: item.name,
        description: item.description,
        ncm: item.ncm,
        qty: item.qty,
        unit: item.unit,
        unit_price: item.unit_price,
        discounts: item.discounts || 0,
        taxes: item.taxes || 0,
        total: (item.qty * item.unit_price) - (item.discounts || 0) + (item.taxes || 0)
    }))

    const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItemsData)

    if (itemsError) {
        console.error('Quote items error:', itemsError)
        return { error: 'Erro ao salvar itens do orçamento.' }
    }

    revalidatePath('/app/quotes')
    return { success: true, quoteId: quoteData.id }
}

export async function deleteQuoteAction(quoteId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('quotes').delete().eq('id', quoteId)

    if (error) {
        return { error: 'Erro ao deletar orçamento.' }
    }
    revalidatePath('/app/quotes')
    return { success: true }
}

export async function updateQuoteStatusAction(quoteId: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId)

    if (error) {
        return { error: 'Erro ao atualizar status do orçamento.' }
    }
    revalidatePath('/app/quotes')
    return { success: true }
}

export async function generateQuotePdfAction(quoteId: string, companyId: string) {
    // We'll call an API route to generate the PDF so it can run Puppeteer or similar separately if needed,
    // or we can just fetch the endpoint from the server action.
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        const cookieStore = await cookies()
        const cookieString = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')

        const res = await fetch(`${baseUrl}/api/quotes/${quoteId}/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieString
            },
            body: JSON.stringify({ companyId }),
        })

        if (!res.ok) {
            const errBody = await res.text()
            console.error('API responded with:', res.status, errBody)
            throw new Error(`Falha ao gerar PDF: HTTP ${res.status}`)
        }

        const json = await res.json()
        revalidatePath('/app/quotes')
        return { success: true, pdfUrl: json.pdf_url }
    } catch (error: any) {
        console.error('PDF Generation Error:', error)
        return { error: error.message || 'Erro ao gerar PDF.' }
    }
}
