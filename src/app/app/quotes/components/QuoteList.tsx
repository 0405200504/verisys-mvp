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
import { Button } from '@/components/ui/button'
import { Search, FileText, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { generateQuotePdfAction } from '../actions'
import { toast } from 'sonner'

export function QuoteList({ initialQuotes }: { initialQuotes: any[] }) {
    const { activeCompany } = useAppContext()
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingPdf, setLoadingPdf] = useState<string | null>(null)

    const filteredQuotes = initialQuotes.filter((quote) => {
        if (!activeCompany) return false
        if (quote.company_id !== activeCompany.id) return false

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchClient = quote.clients?.nome_razao_social?.toLowerCase().includes(term)
            return matchClient
        }

        return true
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-500'
            case 'sent': return 'bg-blue-500'
            case 'draft': return 'bg-gray-500'
            case 'rejected': return 'bg-red-500'
            case 'expired': return 'bg-yellow-600'
            default: return 'bg-gray-500'
        }
    }

    const handleGeneratePdf = async (quoteId: string) => {
        if (!activeCompany) return
        setLoadingPdf(quoteId)
        const res = await generateQuotePdfAction(quoteId, activeCompany.id)
        setLoadingPdf(null)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('PDF Gerado com sucesso!')
        }
    }

    if (!activeCompany) {
        return (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Selecione uma empresa no menu superior para ver os orçamentos.
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
                            <TableHead>Número / Emissão</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Total (R$)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações PDF</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum orçamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQuotes.map((quote) => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">
                                        {quote.number ? `#${quote.number}` : '-'}
                                        <span className="block text-xs text-muted-foreground">
                                            {quote.issued_at ? format(new Date(quote.issued_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{quote.clients?.nome_razao_social || 'Desconhecido'}</TableCell>
                                    <TableCell>
                                        {quote.total
                                            ? quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusColor(quote.status)}`}>
                                            {quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2 flex justify-end">
                                        {quote.pdf_url ? (
                                            <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-4 w-4 mr-1" /> Baixar
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={loadingPdf === quote.id}
                                                onClick={() => handleGeneratePdf(quote.id)}
                                            >
                                                <FileText className="h-4 w-4 mr-1" />
                                                {loadingPdf === quote.id ? 'Gerando...' : 'Gerar PDF'}
                                            </Button>
                                        )}
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
