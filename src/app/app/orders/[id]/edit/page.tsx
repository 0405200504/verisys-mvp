import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '../../components/OrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Find companies
    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map((m: any) => m.company_id) || []

    // Fetch the order and its items
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .in('company_id', companyIds)
        .single()

    if (orderError || !order) {
        redirect('/app/orders')
    }

    const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)

    const [{ data: clients }, { data: products }] = await Promise.all([
        supabase.from('clients').select('id, nome_razao_social, company_id').in('company_id', companyIds).eq('status', 'ativo'),
        supabase.from('products').select('id, name, preco_base, company_id').in('company_id', companyIds).eq('status', 'ativo'),
    ])

    // Format items to match OrderForm structure
    const formattedItems = (itemsData || []).map(item => ({
        id: item.id,
        product_id: item.product_id || '',
        name: item.description_snapshot || '',
        qty: item.qty,
        unit_price: item.unit_price,
        discount_value: item.discount_value,
        total: item.total
    }))

    const initialData = {
        ...order,
        items: formattedItems
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <Link href="/app/orders" className="text-sm text-muted-foreground flex items-center hover:underline mb-2 w-fit">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para Pedidos
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Editar Pedido {order.number ? `#${order.number}` : ''}</h1>
                <p className="text-muted-foreground">
                    Atualize os detalhes do pedido abaixo.
                </p>
            </div>

            <OrderForm
                clients={clients || []}
                products={products || []}
                initialData={initialData}
                orderId={order.id}
            />
        </div>
    )
}
