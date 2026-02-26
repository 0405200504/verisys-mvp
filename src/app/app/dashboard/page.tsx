import { createClient } from '@/lib/supabase/server'
import { DashboardView } from './components/DashboardView'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Find all products to populate the product filter dropdown
    // We'll get products only for the user's companies
    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map((m: any) => m.company_id) || []

    const { data: products } = await supabase
        .from('products')
        .select('id, name, company_id')
        .in('company_id', companyIds)
        .eq('status', 'ativo')
        .order('name')

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-4 mb-2">
                <button className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex gap-4 text-xs font-medium text-zinc-500">
                    <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg> Vendas</span>
                    <span className="text-zinc-300">|</span>
                    <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg> Exportar Relatório</span>
                </div>
            </div>

            <div className="mb-2">
                <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-900 dark:text-white">
                    Performance de Vendas
                </h1>
            </div>

            <DashboardView products={products || []} />
        </div>
    )
}
