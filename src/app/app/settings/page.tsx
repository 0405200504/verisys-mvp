import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from './components/ProfileForm'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex flex-col gap-6 max-w-2xl px-2">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie as configurações da sua conta e perfil.
                </p>
            </div>

            <Card className="rounded-[1.5rem] shadow-sm border border-border/40">
                <CardHeader>
                    <CardTitle>Meu Perfil</CardTitle>
                    <CardDescription>
                        Atualize suas informações pessoais de identificação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm initialData={profile} email={user.email || ''} />
                </CardContent>
            </Card>
        </div>
    )
}
