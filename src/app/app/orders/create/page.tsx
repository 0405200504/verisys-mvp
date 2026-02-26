import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '../components/OrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function CreateOrderPage() {
    const supabase = await createClient()

    // Find companies
    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map((m: any) => m.company_id) || []

    const [{ data: clients }, { data: products }] = await Promise.all([
        supabase.from('clients').select('id, nome_razao_social, company_id').in('company_id', companyIds).eq('status', 'ativo'),
        supabase.from('products').select('id, name, preco_base, company_id').in('company_id', companyIds).eq('status', 'ativo'),
    ])

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            <div>
                <Link href="/app/orders" className="text-sm text-muted-foreground flex items-center hover:underline mb-2 w-fit">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para Pedidos
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Novo Pedido</h1>
                <p className="text-muted-foreground">
                    Preencha os dados abaixo para gerar um novo pedido.
                </p>
            </div>

            <OrderForm clients={clients || []} products={products || []} />
        </div>
    )
}
