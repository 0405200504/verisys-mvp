'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCompany } from '../actions'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Salvar Empresa'}
        </Button>
    )
}

export function CompanyDialog() {
    const [open, setOpen] = useState(false)

    async function clientAction(formData: FormData) {
        const result = await createCompany(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Empresa criada com sucesso!')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Empresa</DialogTitle>
                    <DialogDescription>
                        Cadastre os dados da nova empresa que você representa.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Fantasia *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: ACME Corp"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="legal_name">Razão Social (Opcional)</Label>
                            <Input
                                id="legal_name"
                                name="legal_name"
                                placeholder="Ex: ACME Corporation LTDA"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                            <Input id="cnpj" name="cnpj" placeholder="00.000.000/0001-00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail (Opcional)</Label>
                            <Input id="email" name="email" type="email" placeholder="contato@acme.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
