import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppProvider } from '@/components/providers/AppProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Companies the user is a member of
    const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .order('name')

    const initialCompanies = companiesData || []

    return (
        <AppProvider initialUser={user} initialCompanies={initialCompanies}>
            <div className="flex h-screen overflow-hidden bg-background p-3 gap-4">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden bg-card rounded-[2rem] shadow-[0px_4px_24px_rgba(0,0,0,0.02)] border border-border/40">
                    {/* Topbar */}
                    <Topbar />

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto p-8 relative rounded-b-[2rem]">
                        {children}
                    </main>
                </div>
            </div>
        </AppProvider>
    )
}
