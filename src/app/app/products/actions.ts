'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProductAction(formData: FormData, companyId: string) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const preco_base = formData.get('preco_base') as string
    const custo = formData.get('custo') as string

    if (!name) {
        return { error: 'O nome do produto é obrigatório.' }
    }

    const { data: userResponse } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('products')
        .insert([
            {
                company_id: companyId,
                name,
                sku: sku || null,
                preco_base: preco_base ? parseFloat(preco_base) : null,
                custo: custo ? parseFloat(custo) : null,
                created_by: userResponse.user?.id,
            },
        ])
        .select()

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar produto.' }
    }

    revalidatePath('/app/products')
    return { success: true }
}

export async function deleteProductAction(productId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
        return { error: 'Erro ao deletar produto.' }
    }
    revalidatePath('/app/products')
    return { success: true }
}
