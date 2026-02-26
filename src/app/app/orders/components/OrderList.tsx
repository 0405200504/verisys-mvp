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
import { Search, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function OrderList({ initialOrders }: { initialOrders: any[] }) {
    const { activeCompany } = useAppContext()
    const [searchTerm, setSearchTerm] = useState('')

    const filteredOrders = initialOrders.filter((order) => {
        if (!activeCompany) return false
        if (order.company_id !== activeCompany.id) return false

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchClient = order.clients?.nome_razao_social?.toLowerCase().includes(term)
            const matchName = order.name?.toLowerCase().includes(term)
            return matchClient || matchName
        }

        return true
    })

    // Helper color logic
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'aprovado': return 'bg-green-500'
            case 'faturado': return 'bg-blue-500'
            case 'enviado': return 'bg-yellow-500'
            case 'cancelado': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    if (!activeCompany) {
        return (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Selecione uma empresa no menu superior para ver os pedidos.
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
                        placeholder="Buscar por cliente..."
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
                            <TableHead>Número / Nome</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Total (R$)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhum pedido encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{order.number ? `#${order.number}` : '-'} {order.name ? `- ${order.name}` : ''}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.clients?.nome_razao_social || 'Desconhecido'}</TableCell>
                                    <TableCell>
                                        {order.total
                                            ? order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/app/orders/${order.id}/edit`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
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
