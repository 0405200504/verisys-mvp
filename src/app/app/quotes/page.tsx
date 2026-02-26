import { createClient } from '@/lib/supabase/server'
import { QuoteList } from './components/QuoteList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function QuotesPage() {
    const supabase = await createClient()

    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map((m: any) => m.company_id) || []

    const { data: quotes } = await supabase
        .from('quotes')
        .select('*, clients(nome_razao_social)')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
                    <p className="text-muted-foreground">
                        Elabore orçamentos comerciais e gere PDFs para seus clientes.
                    </p>
                </div>
                <Link href="/app/quotes/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Orçamento
                    </Button>
                </Link>
            </div>

            <QuoteList initialQuotes={quotes || []} />
        </div>
    )
}
