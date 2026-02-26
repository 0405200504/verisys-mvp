'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'

interface Company {
    id: string
    name: string
    logo_url?: string
}

interface AppContextType {
    user: User | null
    companies: Company[]
    activeCompany: Company | null
    setActiveCompany: (company: Company | null) => void
    isLoading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({
    children,
    initialUser,
    initialCompanies,
}: {
    children: ReactNode
    initialUser: User | null
    initialCompanies: Company[]
}) {
    const [activeCompany, setActiveCompany] = useState<Company | null>(null)

    useEffect(() => {
        if (initialCompanies.length > 0) {
            // Trying to restore from localStorage first
            const storedTheme = localStorage.getItem('central-de-pedidos-company')
            if (storedTheme) {
                const found = initialCompanies.find((c) => c.id === storedTheme)
                if (found) {
                    setActiveCompany(found)
                    return
                }
            }
            setActiveCompany(initialCompanies[0])
        }
    }, [initialCompanies])

    const handleSetActiveCompany = (company: Company | null) => {
        setActiveCompany(company)
        if (company) {
            localStorage.setItem('central-de-pedidos-company', company.id)
            // We might want to trigger a router.refresh() here or use searchParams down the line
            // to ensure server components also get the fresh data.
            // For now, holding in state is a good start. 
        } else {
            localStorage.removeItem('central-de-pedidos-company')
        }
    }

    return (
        <AppContext.Provider
            value={{
                user: initialUser,
                companies: initialCompanies,
                activeCompany,
                setActiveCompany: handleSetActiveCompany,
                isLoading: false,
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}
