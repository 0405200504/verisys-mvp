'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompany(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    const name = formData.get('name') as string
    const legal_name = formData.get('legal_name') as string
    const cnpj = formData.get('cnpj') as string
    const email = formData.get('email') as string

    if (!name) {
        return { error: 'O nome da empresa é obrigatório.' }
    }

    // 1. Create company
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([
            {
                owner_id: user.id,
                name,
                legal_name,
                cnpj,
                email,
            },
        ])
        .select()
        .single()

    if (companyError || !company) {
        console.error(companyError)
        return { error: 'Erro ao criar a empresa.' }
    }

    // 2. Add current user to company_members
    const { error: memberError } = await supabase
        .from('company_members')
        .insert([
            {
                company_id: company.id,
                user_id: user.id,
                role: 'owner',
            },
        ])

    if (memberError) {
        console.error(memberError)
        return { error: 'Erro ao vincular perfil à empresa.' }
    }

    revalidatePath('/app', 'layout') // Revalidate layout to update Topbar generic company list
    return { success: true }
}

export async function deleteCompany(companyId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

    if (deleteError) {
        console.error(deleteError)
        return { error: 'Erro ao excluir a empresa. Verifique se você é o proprietário.' }
    }

    revalidatePath('/app', 'layout')
    return { success: true }
}
