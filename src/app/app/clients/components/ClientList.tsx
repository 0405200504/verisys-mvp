'use client'

import { useState } from 'react'
import { useAppContext } from '@/components/providers/AppProvider'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ClientList({ initialClients }: { initialClients: any[] }) {
    const { activeCompany } = useAppContext()
    const [searchTerm, setSearchTerm] = useState('')

    // Filter by active company and search term
    const filteredClients = initialClients.filter((client) => {
        if (!activeCompany) return false
        if (client.company_id !== activeCompany.id) return false

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchName = client.nome_razao_social.toLowerCase().includes(term)
            const matchCnpj = client.cpf_cnpj?.includes(term)
            return matchName || matchCnpj
        }

        return true
    })

    if (!activeCompany) {
        return (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Selecione uma empresa no menu superior para ver os clientes.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome ou CPF/CNPJ..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome / Razão Social</TableHead>
                            <TableHead>CPF / CNPJ</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Cadastrado em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhum cliente encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        {client.nome_razao_social}
                                        {client.nome_fantasia && (
                                            <span className="block text-xs text-muted-foreground">
                                                {client.nome_fantasia}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{client.cpf_cnpj || '-'}</TableCell>
                                    <TableCell>
                                        {client.telefone || '-'}
                                        {client.email && (
                                            <span className="block text-xs text-muted-foreground">
                                                {client.email}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {client.cidade || '-'} {client.estado ? `/ ${client.estado}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === 'ativo' ? 'default' : 'secondary'}>
                                            {client.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {client.created_at
                                            ? format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
