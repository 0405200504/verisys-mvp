'use client'

import { useAppContext } from '@/components/providers/AppProvider'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, ChevronDown, User as UserIcon } from 'lucide-react'
import { signOut } from '@/app/login/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Topbar() {
    const { user, companies, activeCompany, setActiveCompany } = useAppContext()

    return (
        <header className="flex h-20 shrink-0 items-center justify-between px-8 bg-transparent">

            {/* Company Selector */}
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-between">
                            {activeCompany ? (
                                <div className="flex items-center gap-2 truncate">
                                    <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
                                    <span className="truncate">{activeCompany.name}</span>
                                </div>
                            ) : (
                                <span className="text-zinc-500">Selecionar Empresa...</span>
                            )}
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                        <DropdownMenuLabel>Minhas Empresas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {companies.map((company) => (
                            <DropdownMenuItem
                                key={company.id}
                                onClick={() => setActiveCompany(company)}
                                className="cursor-pointer"
                            >
                                {company.name}
                            </DropdownMenuItem>
                        ))}
                        {companies.length === 0 && (
                            <DropdownMenuItem disabled>Nenhuma empresa</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                    <UserIcon className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Minha Conta</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()}>
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
