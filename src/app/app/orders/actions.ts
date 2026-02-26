'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOrderAction(
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
    let shipping_total = parseFloat(data.shipping_total || '0')

    for (const item of items) {
        subtotal += (item.qty * item.unit_price) - (item.discount_value || 0)
    }

    const total = subtotal - discount_total + shipping_total

    // 1. Insert Order
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
            {
                company_id: companyId,
                client_id: clientId,
                name: data.name || null,
                status: data.status || 'rascunho',
                subtotal,
                discount_total,
                shipping_total,
                total,
                payment_method: data.payment_method,
                payment_terms: data.payment_terms,
                notes_internal: data.notes_internal,
                notes_client: data.notes_client,
                created_by: userResponse.user.id,
            },
        ])
        .select()
        .single()

    if (orderError) {
        console.error('Order creation error:', orderError)
        return { error: 'Erro ao criar pedido.' }
    }

    // 2. Insert Items
    const orderItemsData = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        description_snapshot: item.name,
        qty: item.qty,
        unit_price: item.unit_price,
        discount_value: item.discount_value || 0,
        total: (item.qty * item.unit_price) - (item.discount_value || 0)
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

    if (itemsError) {
        console.error('Order items error:', itemsError)
        // Rollback order is not strictly necessary here, but would be good practice
        return { error: 'Erro ao salvar itens do pedido.' }
    }

    revalidatePath('/app/orders')
    return { success: true, orderId: orderData.id }
}

export async function deleteOrderAction(orderId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('orders').delete().eq('id', orderId)

    if (error) {
        return { error: 'Erro ao deletar pedido.' }
    }
    revalidatePath('/app/orders')
    return { success: true }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) {
        return { error: 'Erro ao atualizar status do pedido.' }
    }
    revalidatePath('/app/orders')
    return { success: true }
}

export async function updateOrderAction(
    orderId: string,
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
    let shipping_total = parseFloat(data.shipping_total || '0')

    for (const item of items) {
        subtotal += (item.qty * item.unit_price) - (item.discount_value || 0)
    }

    const total = subtotal - discount_total + shipping_total

    // 1. Update Order
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            client_id: clientId,
            name: data.name || null,
            status: data.status || 'rascunho',
            subtotal,
            discount_total,
            shipping_total,
            total,
            payment_method: data.payment_method,
            payment_terms: data.payment_terms,
            notes_internal: data.notes_internal,
            notes_client: data.notes_client,
            updated_by: userResponse.user.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (orderError) {
        console.error('Order update error:', orderError)
        return { error: 'Erro ao atualizar pedido.' }
    }

    // 2. Delete existing items
    const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

    if (deleteItemsError) {
        console.error('Order items delete error:', deleteItemsError)
        return { error: 'Erro ao remover itens antigos.' }
    }

    // 3. Insert new items
    const orderItemsData = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id || null, // Allow manual items
        description_snapshot: item.name,
        qty: item.qty,
        unit_price: item.unit_price,
        discount_value: item.discount_value || 0,
        total: (item.qty * item.unit_price) - (item.discount_value || 0)
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

    if (itemsError) {
        console.error('Order items error:', itemsError)
        return { error: 'Erro ao salvar itens do pedido.' }
    }

    revalidatePath('/app/orders')
    return { success: true, orderId }
}

