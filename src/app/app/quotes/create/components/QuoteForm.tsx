'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/components/providers/AppProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { createQuoteAction } from '../../actions'
import { toast } from 'sonner'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

type Item = {
    id: string
    product_id: string
    name: string
    description: string
    ncm: string
    unit: string
    qty: number
    unit_price: number
    discounts: number
    taxes: number
}

export function QuoteForm({ clients, products }: { clients: any[], products: any[] }) {
    const router = useRouter()
    const { activeCompany } = useAppContext()
    const [loading, setLoading] = useState(false)

    const [clientId, setClientId] = useState('')
    const [items, setItems] = useState<Item[]>([])
    const [discountTotal, setDiscountTotal] = useState(0)
    const [taxTotal, setTaxTotal] = useState(0)
    const [shippingTotal, setShippingTotal] = useState(0)
    const [paymentTerms, setPaymentTerms] = useState('')
    const [deliveryTime, setDeliveryTime] = useState('')
    const [freightType, setFreightType] = useState('CIF')
    const [carrier, setCarrier] = useState('')
    const [notesCommercial, setNotesCommercial] = useState('')
    const [notesFiscal, setNotesFiscal] = useState('')
    const [validUntil, setValidUntil] = useState('')

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                product_id: '',
                name: '',
                description: '',
                ncm: '',
                unit: 'UN',
                qty: 1,
                unit_price: 0,
                discounts: 0,
                taxes: 0,
            },
        ])
    }

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
    }

    const handleItemChange = (id: string, field: keyof Item, value: any) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newItem = { ...item, [field]: value }
                    // If product changed, auto-fill standard fields
                    if (field === 'product_id' && value) {
                        const product = products.find((p) => p.id === value)
                        if (product) {
                            newItem.name = product.name
                            newItem.description = product.descricao_curta || ''
                            newItem.unit_price = product.preco_base || 0
                            newItem.ncm = product.ncm || ''
                        }
                    }
                    return newItem
                }
                return item
            })
        )
    }

    // Calculate Subtotal and Total
    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.unit_price) - item.discounts + item.taxes, 0)
    const total = subtotal - discountTotal + taxTotal + shippingTotal

    const activeClients = clients.filter(c => c.company_id === activeCompany?.id)
    const activeProducts = products.filter(p => p.company_id === activeCompany?.id)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeCompany) {
            toast.error('Nenhuma empresa ativa.')
            return
        }
        if (!clientId) {
            toast.error('Selecione um cliente.')
            return
        }
        if (items.length === 0) {
            toast.error('Adicione pelo menos um item.')
            return
        }

        setLoading(true)
        const result = await createQuoteAction(
            activeCompany.id,
            clientId,
            items,
            {
                discount_total: discountTotal,
                tax_total: taxTotal,
                shipping_total: shippingTotal,
                payment_terms: paymentTerms,
                delivery_time: deliveryTime,
                freight_type: freightType,
                carrier: carrier,
                notes_commercial: notesCommercial,
                notes_fiscal: notesFiscal,
                valid_until: validUntil || null,
                status: 'draft'
            }
        )
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Orçamento criado com sucesso!')
            router.push('/app/quotes')
            router.refresh()
        }
    }

    if (!activeCompany) {
        return <div>Selecione uma empresa para criar um orçamento.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            <Card>
                <CardHeader>
                    <CardTitle>Cliente e Condições Comerciais</CardTitle>
                    <CardDescription>Defina para quem é o orçamento e os prazos</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <select
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {activeClients.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Validade do Orçamento (Data)</Label>
                        <Input
                            type="date"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Condições de Pagamento</Label>
                        <Input
                            placeholder="Ex: 30/60/90, A vista..."
                            value={paymentTerms}
                            onChange={e => setPaymentTerms(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Prazo de Entrega</Label>
                        <Input
                            placeholder="Ex: 15 dias úteis"
                            value={deliveryTime}
                            onChange={e => setDeliveryTime(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Frete</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={freightType}
                            onChange={(e) => setFreightType(e.target.value)}
                        >
                            <option value="CIF">CIF (Emitente paga)</option>
                            <option value="FOB">FOB (Destinatário paga)</option>
                            <option value="RETIRADA">Retirada</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Transportadora</Label>
                        <Input
                            placeholder="Ex: TransBrasil"
                            value={carrier}
                            onChange={e => setCarrier(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Itens do Orçamento</CardTitle>
                        <CardDescription>Adicione os produtos, impostos por item e detalhes</CardDescription>
                    </div>
                    <Button type="button" onClick={handleAddItem} variant="secondary" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Produto
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-6 border rounded-md border-dashed">
                            Nenhum item adicionado.
                        </div>
                    )}
                    {items.map((item, index) => (
                        <div key={item.id} className="flex flex-col gap-4 p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">Item {index + 1}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-12">
                                <div className="space-y-2 sm:col-span-3">
                                    <Label>Produto Base</Label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={item.product_id}
                                        onChange={(e) => handleItemChange(item.id, 'product_id', e.target.value)}
                                    >
                                        <option value="">Item Ad-hoc (Livre)</option>
                                        {activeProducts.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-3">
                                    <Label>Nome Customizado</Label>
                                    <Input
                                        placeholder="Nome na proposta..."
                                        value={item.name}
                                        onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Unidade</Label>
                                    <Input
                                        placeholder="UN"
                                        value={item.unit}
                                        onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>NCM</Label>
                                    <Input
                                        placeholder="0000.00.00"
                                        value={item.ncm}
                                        onChange={e => handleItemChange(item.id, 'ncm', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Qtd</Label>
                                    <Input
                                        type="number" min="0.01" step="0.01"
                                        value={item.qty}
                                        onChange={e => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-3">
                                    <Label>Preço Unitário (R$)</Label>
                                    <Input
                                        type="number" step="0.01"
                                        value={item.unit_price}
                                        onChange={e => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-3">
                                    <Label>Descontos Item (R$)</Label>
                                    <Input
                                        type="number" step="0.01"
                                        value={item.discounts}
                                        onChange={e => handleItemChange(item.id, 'discounts', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-3">
                                    <Label>Impostos somados (R$)</Label>
                                    <Input
                                        type="number" step="0.01"
                                        value={item.taxes}
                                        onChange={e => handleItemChange(item.id, 'taxes', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-12 md:col-span-3 flex items-end justify-end">
                                    <div className="font-semibold text-lg text-right w-full sm:w-auto text-primary">
                                        {((item.qty * item.unit_price) - item.discounts + item.taxes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fechamento e Observações</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4 border-r pr-4">
                        <div className="space-y-2">
                            <Label>Desconto Geral (R$)</Label>
                            <Input
                                type="number" step="0.01"
                                value={discountTotal}
                                onChange={e => setDiscountTotal(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Acréscimos / Impostos Gerais (R$)</Label>
                            <Input
                                type="number" step="0.01"
                                value={taxTotal}
                                onChange={e => setTaxTotal(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Frete / Seguro Total (R$)</Label>
                            <Input
                                type="number" step="0.01"
                                value={shippingTotal}
                                onChange={e => setShippingTotal(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Subtotal dos Itens (Já com desconto/imposto unitário)</Label>
                            <div className="text-xl text-muted-foreground">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Total da Proposta</Label>
                            <div className="text-3xl font-bold text-primary">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Observação Comercial (Vai no PDF)</Label>
                            <Textarea
                                placeholder="Opcional. Ex: Condições sujeitas a análise de crédito."
                                className="resize-none h-24"
                                value={notesCommercial}
                                onChange={e => setNotesCommercial(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Observação Fiscal</Label>
                            <Textarea
                                placeholder="Opcional."
                                className="resize-none h-24"
                                value={notesFiscal}
                                onChange={e => setNotesFiscal(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Processando...' : 'Salvar Orçamento'}
                </Button>
            </div>
        </form>
    )
}
