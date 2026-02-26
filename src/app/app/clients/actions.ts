'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData, companyId: string) {
    const supabase = await createClient()

    const tipo_pessoa = formData.get('tipo_pessoa') as 'PF' | 'PJ'
    const nome_razao_social = formData.get('nome_razao_social') as string
    const nome_fantasia = formData.get('nome_fantasia') as string
    const cpf_cnpj = formData.get('cpf_cnpj') as string
    const email = formData.get('email') as string
    const telefone = formData.get('telefone') as string
    const cidade = formData.get('cidade') as string
    const estado = formData.get('estado') as string

    if (!nome_razao_social) {
        return { error: 'O nome / razão social é obrigatório.' }
    }

    const { data: userResponse } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('clients')
        .insert([
            {
                company_id: companyId,
                tipo_pessoa,
                nome_razao_social,
                nome_fantasia,
                cpf_cnpj,
                email,
                telefone,
                cidade,
                estado,
                created_by: userResponse.user?.id,
            },
        ])
        .select()

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar cliente.' }
    }

    revalidatePath('/app/clients')
    return { success: true }
}

export async function deleteClientAction(clientId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('clients').delete().eq('id', clientId)

    if (error) {
        return { error: 'Erro ao deletar cliente.' }
    }
    revalidatePath('/app/clients')
    return { success: true }
}
