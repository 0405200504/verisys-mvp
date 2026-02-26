import { createClient } from '@/lib/supabase/server'
import { ClientDialog } from './components/ClientDialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// Because we need to fetch data client-side based on the selected company,
// the best approach in Next App Router with standard Provider is to have a 
// wrapping Client Component that listens to AppProvider and fetches or passes 
// the company ID to a child server component, or just fetches it client-side.
// Alternatively, since Server Components can't read the React Context (AppProvider),
// we will fetch all clients for the user's companies in a Server Component, 
// and pass them to a Client Component to filter based on Context.

import { ClientList } from './components/ClientList'

export default async function ClientsPage() {
    const supabase = await createClient()

    // Find the companies this user is a member of to fetch their clients
    const { data: members } = await supabase
        .from('company_members')
        .select('company_id')

    const companyIds = members?.map(m => m.company_id) || []

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gerencie carteira de clientes, pesquise e cadastre.
                    </p>
                </div>
                <ClientDialog />
            </div>

            <ClientList initialClients={clients || []} />
        </div>
    )
}
