'use client'

import { useEffect, useState } from 'react'
import { useAppContext } from '@/components/providers/AppProvider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { FileText, DollarSign, TrendingUp, Filter, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

// Simple color palette for charts matching inspiration
const COLORS = ['#bcfb00', '#18181b', '#a1a1aa', '#3f3f46', '#e4e4e7']

export function DashboardView({ products }: { products: any[] }) {
    const { activeCompany } = useAppContext()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    // Filters
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [productId, setProductId] = useState('')

    const fetchKpis = async () => {
        if (!activeCompany) return
        setLoading(true)

        // Call our RPC function
        const { data: result, error } = await supabase.rpc('get_dashboard_kpis', {
            p_company_id: activeCompany.id,
            p_start_date: dateFrom || null,
            p_end_date: dateTo || null,
            p_product_id: productId || null,
        })

        if (!error && result) {
            setData(result)
        } else {
            console.error('RPC Error:', error)
        }
        setLoading(false)
    }

    // Initial load and whenever company changes
    useEffect(() => {
        fetchKpis()
    }, [activeCompany])

    if (!activeCompany) {
        return (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                Selecione uma empresa no menu superior para ver os resultados.
            </div>
        )
    }

    const handleApplyFilters = () => {
        fetchKpis()
    }

    const handleClearFilters = () => {
        setDateFrom('')
        setDateTo('')
        setProductId('')
        // Need to trigger fetch after state updates, better to use a useEffect or fetch immediately with cleared logic
        // We'll trust the next render or we can pass null directly:
        setTimeout(() => {
            // Small timeout to allow state to flush if we don't put it in a ref. 
            // For MVP it's simpler to just set state, but we'll fetch with nulls now to be sure it clears immediately:
            setLoading(true)
            supabase.rpc('get_dashboard_kpis', {
                p_company_id: activeCompany.id,
                p_start_date: null,
                p_end_date: null,
                p_product_id: null,
            }).then(({ data: result, error }) => {
                if (!error && result) setData(result)
                setLoading(false)
            })
        }, 0)
    }

    return (
        <div className="space-y-8 pb-12 w-full max-w-6xl mx-auto">

            {/* FILTERS - Rounded Pill Style */}
            <div className="bg-white dark:bg-zinc-900 rounded-full shadow-sm p-3 flex flex-col sm:flex-row items-center gap-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex-1 flex gap-4 px-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">De:</Label>
                        <Input
                            type="date"
                            className="h-8 text-xs border-none bg-zinc-50 dark:bg-zinc-800 rounded-full w-full sm:w-[130px]"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Até:</Label>
                        <Input
                            type="date"
                            className="h-8 text-xs border-none bg-zinc-50 dark:bg-zinc-800 rounded-full w-full sm:w-[130px]"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto px-3">
                    <select
                        className="h-8 rounded-full border-none bg-zinc-50 dark:bg-zinc-800 px-4 py-1 text-xs w-full sm:w-[180px] outline-none"
                        value={productId}
                        onChange={e => setProductId(e.target.value)}
                    >
                        <option value="">Todos os produtos</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto ml-auto px-2">
                    <button
                        onClick={handleApplyFilters}
                        className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                        <Filter className="h-4 w-4" />
                    </button>
                    {(dateFrom || dateTo || productId) && (
                        <button
                            onClick={handleClearFilters}
                            className="h-8 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {loading && <div className="text-muted-foreground text-sm animate-pulse text-center">Atualizando painel...</div>}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* HERO KPI: Faturamento (Lime Green) */}
                <div className="col-span-1 md:col-span-4 bg-[#bcfb00] rounded-[2rem] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/20 blur-3xl rounded-full pointer-events-none"></div>

                    <div className="flex justify-between items-start z-10 relative">
                        <div className="bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-zinc-900 inline-flex items-center gap-1">
                            <span>Vantagens</span>
                        </div>
                        <button className="h-8 w-8 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/60 transition-colors mt-[-0.5rem] mr-[-0.5rem]">
                            <ArrowUpRight className="h-4 w-4 text-zinc-800" />
                        </button>
                    </div>

                    <div className="mt-12 z-10 relative">
                        <h3 className="text-zinc-800 text-sm font-medium mb-1">Faturamento Bruto</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-light text-zinc-900 tracking-tight">
                                {data?.total_faturado
                                    ? Number(data.total_faturado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).replace('R$', '')
                                    : '0'}
                            </span>
                        </div>
                        <p className="text-zinc-700 text-xs mt-2">Valores aprovados no período</p>
                    </div>
                </div>

                {/* SMALLER KPIs */}
                <div className="col-span-1 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Pedidos */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-zinc-500 text-sm mb-4">Atividade (Pedidos)</h3>
                                <div className="text-5xl font-light tracking-tight">{data?.total_pedidos || 0}</div>
                            </div>
                            <div className="bg-[#bcfb00] text-zinc-900 text-[10px] font-bold px-2 py-1 rounded-sm mt-1">
                                TOTAL
                            </div>
                        </div>
                        <div className="mt-8 flex items-end gap-1 h-12 opacity-40">
                            {/* Fake mini bar chart for design flair */}
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-full rounded-t-sm flex items-end gap-[2px]">
                                {[40, 60, 30, 80, 50, 90, 45].map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`} style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ticket Medio */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-zinc-500 text-sm mb-4">Ticket Médio</h3>
                                <div className="text-4xl font-light tracking-tight">
                                    {data?.ticket_medio
                                        ? Number(data.ticket_medio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                                        : 'R$ 0'}
                                </div>
                            </div>
                            <button className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 mt-1">
                                <ArrowUpRight className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="mt-8 relative h-12 w-full">
                            {/* Fake Sparkline */}
                            <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                                <path d="M0,20 Q10,25 20,15 T40,25 T60,5 T80,20 T100,10" fill="none" stroke="#18181b" strokeWidth="1.5" className="dark:stroke-white" />
                                <circle cx="60" cy="5" r="3" fill="#bcfb00" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Comparison of Revenue (Replaces generic Area / Bar) */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-zinc-800 dark:text-zinc-100 font-medium">Top Produtos Vendidos</h3>
                            <p className="text-xs text-zinc-500 mt-1">Por quantidade contabilizada</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                                <Filter className="h-3 w-3 text-white dark:text-zinc-900" />
                            </button>
                        </div>
                    </div>

                    <div className="h-[220px]">
                        {data?.top_products?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.top_products} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="qty" fill="#18181b" className="dark:fill-white" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                        {
                                            data.top_products.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#bcfb00' : (index === 1 ? '#a1a1aa' : '#e4e4e7')} className={index === 0 ? '' : 'dark:fill-zinc-700'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-400">Sem dados no período</div>
                        )}
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-zinc-800 dark:text-zinc-100 font-medium">Funil de Vendas</h3>
                            <p className="text-xs text-zinc-500 mt-1">Distribuição por status</p>
                        </div>
                        <button className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            <ArrowUpRight className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="h-[220px] flex items-center justify-center relative">
                        {data?.status_counts?.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.status_counts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="count"
                                            stroke="none"
                                        >
                                            {data.status_counts.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-light">{data.total_pedidos}</span>
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Total</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-zinc-400">Sem dados no período</div>
                        )}
                    </div>
                </div>

                {/* Top Clients - Wide Bottom block */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-8">
                    <div className="sm:w-1/3">
                        <h3 className="text-zinc-800 dark:text-zinc-100 font-medium text-lg mb-2">Melhores Clientes</h3>
                        <p className="text-sm text-zinc-500 mb-6">Concentração de receita filtrada.</p>

                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700">
                            <div className="text-xs text-zinc-500 mb-1">Maior Receita</div>
                            <div className="text-xl font-medium tracking-tight truncate">
                                {data?.top_clients?.[0]?.name || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        {data?.top_clients?.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                {data.top_clients.map((client: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3 w-1/2">
                                            <div className="w-6 text-xs text-zinc-400 text-right">{i + 1}.</div>
                                            <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300 truncate">{client.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-semibold">{Number(client.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            <button className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <ArrowRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Nenhum cliente com pedidos finalizados</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
