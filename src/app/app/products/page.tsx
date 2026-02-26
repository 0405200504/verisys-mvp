import { createClient } from '@/lib/supabase/server'
import { ProductDialog } from './components/ProductDialog'
import { ProductList } from './components/ProductList'

export default async function ProductsPage() {
    const supabase = await createClient()

    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map(m => m.company_id) || []

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
                    <p className="text-muted-foreground">
                        Catálogo de produtos completo para suas propostas e pedidos.
                    </p>
                </div>
                <ProductDialog />
            </div>

            <ProductList initialProducts={products || []} />
        </div>
    )
}
