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

export function ProductList({ initialProducts }: { initialProducts: any[] }) {
    const { activeCompany } = useAppContext()
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProducts = initialProducts.filter((product) => {
        if (!activeCompany) return false
        if (product.company_id !== activeCompany.id) return false

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchName = product.name.toLowerCase().includes(term)
            const matchSku = product.sku?.toLowerCase().includes(term)
            return matchName || matchSku
        }

        return true
    })

    if (!activeCompany) {
        return (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Selecione uma empresa no menu superior para ver os produtos.
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
                        placeholder="Buscar por nome ou SKU..."
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
                            <TableHead>Nome</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Preço (R$)</TableHead>
                            <TableHead>NCM</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum produto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku || '-'}</TableCell>
                                    <TableCell>
                                        {product.preco_base
                                            ? product.preco_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>{product.ncm || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'ativo' ? 'default' : 'secondary'}>
                                            {product.status}
                                        </Badge>
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
