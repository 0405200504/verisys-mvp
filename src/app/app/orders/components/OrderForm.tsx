'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/components/providers/AppProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { createOrderAction, updateOrderAction } from '../actions'
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
    qty: number
    unit_price: number
    discount_value: number
}

export function OrderForm({ clients, products, initialData, orderId }: { clients: any[], products: any[], initialData?: any, orderId?: string }) {
    const router = useRouter()
    const { activeCompany } = useAppContext()
    const [loading, setLoading] = useState(false)

    const [name, setName] = useState(initialData?.name || '')
    const [status, setStatus] = useState(initialData?.status || 'rascunho')
    const [clientId, setClientId] = useState(initialData?.client_id || '')
    const [items, setItems] = useState<Item[]>(initialData?.items || [])
    const [discountTotal, setDiscountTotal] = useState(initialData?.discount_total || 0)
    const [shippingTotal, setShippingTotal] = useState(initialData?.shipping_total || 0)
    const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || '')
    const [paymentTerms, setPaymentTerms] = useState(initialData?.payment_terms || '')
    const [notesClient, setNotesClient] = useState(initialData?.notes_client || '')
    const [notesInternal, setNotesInternal] = useState(initialData?.notes_internal || '')

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                product_id: '',
                name: '',
                qty: 1,
                unit_price: 0,
                discount_value: 0,
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
                    // If product changed, auto-fill price and name
                    if (field === 'product_id' && value) {
                        const product = products.find((p) => p.id === value)
                        if (product) {
                            newItem.name = product.name
                            newItem.unit_price = product.preco_base || 0
                        }
                    }
                    return newItem
                }
                return item
            })
        )
    }

    // Calculate Subtotal and Total
    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.unit_price) - item.discount_value, 0)
    const total = subtotal - discountTotal + shippingTotal

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
        const payload = {
            name,
            status,
            discount_total: discountTotal,
            shipping_total: shippingTotal,
            payment_method: paymentMethod,
            payment_terms: paymentTerms,
            notes_client: notesClient,
            notes_internal: notesInternal,
        }

        let result;
        if (orderId) {
            result = await updateOrderAction(orderId, activeCompany.id, clientId, items, payload)
        } else {
            result = await createOrderAction(activeCompany.id, clientId, items, payload)
        }
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(orderId ? 'Pedido atualizado!' : 'Pedido criado com sucesso!')
            router.push('/app/orders')
            router.refresh()
        }
    }

    if (!activeCompany) {
        return <div>Selecione uma empresa para criar um pedido.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            <Card>
                <CardHeader>
                    <CardTitle>Cliente e Pagamento</CardTitle>
                    <CardDescription>Dados base do pedido</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Nome do Pedido (Opcional)</Label>
                        <Input
                            placeholder="Ex: Pedido Mensal Matriz"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
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
                        <Label>Status do Pedido</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="rascunho">Rascunho</option>
                            <option value="enviado">Enviado</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="faturado">Faturado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Input
                            placeholder="Ex: Boleto, Pix..."
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Condições de Pagamento</Label>
                        <Input
                            placeholder="Ex: 30/60/90"
                            value={paymentTerms}
                            onChange={e => setPaymentTerms(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Itens do Pedido</CardTitle>
                        <CardDescription>Adicione os produtos e quantidades</CardDescription>
                    </div>
                    <Button type="button" onClick={handleAddItem} variant="secondary" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Item
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
                                <div className="space-y-2 sm:col-span-5">
                                    <Label>Produto</Label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        value={item.product_id}
                                        onChange={(e) => handleItemChange(item.id, 'product_id', e.target.value)}
                                    >
                                        <option value="">Manual ou Selecione...</option>
                                        {activeProducts.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {!item.product_id && (
                                        <Input
                                            placeholder="Descrição do item manual"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                        />
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Qtd</Label>
                                    <Input
                                        type="number" min="0.01" step="0.01"
                                        value={item.qty}
                                        onChange={e => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Preço Unit.</Label>
                                    <Input
                                        type="number" step="0.01"
                                        value={item.unit_price}
                                        onChange={e => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Desc. Total Item</Label>
                                    <Input
                                        type="number" step="0.01"
                                        value={item.discount_value}
                                        onChange={e => handleItemChange(item.id, 'discount_value', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-12 md:col-span-1 flex items-end justify-end">
                                    <div className="font-semibold text-lg text-right w-full sm:w-auto">
                                        {((item.qty * item.unit_price) - item.discount_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Totais e Fechamento</CardTitle>
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
                            <Label>Frete Total (R$)</Label>
                            <Input
                                type="number" step="0.01"
                                value={shippingTotal}
                                onChange={e => setShippingTotal(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subtotal</Label>
                            <div className="text-xl">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Total do Pedido</Label>
                            <div className="text-3xl font-bold text-primary">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Observação para o Cliente (Sai no PDF/Email)</Label>
                            <Textarea
                                placeholder="Opcional"
                                className="resize-none"
                                value={notesClient}
                                onChange={e => setNotesClient(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Observação Interna</Label>
                            <Textarea
                                placeholder="Opcional"
                                className="resize-none"
                                value={notesInternal}
                                onChange={e => setNotesInternal(e.target.value)}
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
                    {loading ? 'Salvando...' : (orderId ? 'Salvar Alterações' : 'Criar Pedido')}
                </Button>
            </div>
        </form>
    )
}
