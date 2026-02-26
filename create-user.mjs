import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local precisely if local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    const { data, error } = await supabase.auth.signUp({
        email: 'teste@teste.com',
        password: '123456'
    })

    if (error) {
        console.error('Failed to create test user:', error)
    } else {
        console.log('Test user created successfully:', data.user?.id)
    }
}

main()
