import { createClient } from '@/lib/supabase/server'
import { OrderList } from './components/OrderList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function OrdersPage() {
    const supabase = await createClient()

    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map(m => m.company_id) || []

    // Join clients table to get the client name
    const { data: orders } = await supabase
        .from('orders')
        .select('*, clients(nome_razao_social)')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">
                        Acompanhe os pedidos de venda, altere status e veja detalhes.
                    </p>
                </div>
                <Link href="/app/orders/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Pedido
                    </Button>
                </Link>
            </div>

            <OrderList initialOrders={orders || []} />
        </div>
    )
}
