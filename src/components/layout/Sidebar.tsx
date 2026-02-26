'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    ShoppingCart,
    FileText,
    Settings,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Empresas', href: '/app/companies', icon: Building2 },
    { name: 'Clientes', href: '/app/clients', icon: Users },
    { name: 'Produtos', href: '/app/products', icon: Package },
    { name: 'Pedidos', href: '/app/orders', icon: ShoppingCart },
    { name: 'Orçamentos', href: '/app/quotes', icon: FileText },
    { name: 'Configurações', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-transparent">
            <div className="flex h-20 shrink-0 items-center px-6">
                <span className="text-xl font-bold tracking-tight">Central de Pedidos</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-x-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900'
                                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 shrink-0 transition-colors',
                                    isActive
                                        ? 'text-primary dark:text-primary'
                                        : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
