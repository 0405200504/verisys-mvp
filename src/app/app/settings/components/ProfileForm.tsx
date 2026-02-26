'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
    initialData: any
    email: string
}

export function ProfileForm({ initialData, email }: ProfileFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [phone, setPhone] = useState(initialData?.phone || '')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Sessão expirada.')
            setLoading(false)
            return
        }

        const { error } = await supabase
            .from('profiles')
            .update({ name, phone })
            .eq('id', user.id)

        setLoading(false)

        if (error) {
            console.error(error)
            toast.error('Erro ao atualizar o perfil.')
        } else {
            toast.success('Perfil atualizado com sucesso!')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-zinc-100 dark:bg-zinc-900"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                    O seu e-mail de login não pode ser alterado por aqui.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
    )
}
