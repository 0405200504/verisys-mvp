import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { QuoteDocument } from './QuoteDocument'

// To handle Streams to Buffers
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: any[] = []
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { companyId } = await request.json()

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
        }

        const { data: userResponse } = await supabase.auth.getUser()
        if (!userResponse.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch necessary data
        const [{ data: quote }, { data: items }, { data: company }, { data: client }] = await Promise.all([
            supabase.from('quotes').select('*').eq('id', id).single(),
            supabase.from('quote_items').select('*').eq('quote_id', id),
            supabase.from('companies').select('*').eq('id', companyId).single(),
            // Needs to fetch client details separately if we don't do a join or if it's cleaner
            supabase.from('clients').select('*').in('id', (
                // subquery conceptually, but we can do it inline or separately.
                // Better to fetch quote then client, but doing in parallel if we know quote.client_id
                // Since we didn't await quote first, we must fetch sequentially or rely on join
                []
            ))
        ])

        // Let's refetch sequentially for clean data access
        const { data: qData, error: qError } = await supabase
            .from('quotes')
            .select('*, clients(*), companies(*)')
            .eq('id', id)
            .single()

        if (qError || !qData) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
        }

        const { data: iData } = await supabase
            .from('quote_items')
            .select('*')
            .eq('quote_id', id)

        // Render PDF
        const stream = await renderToStream(
            <QuoteDocument
                quote={qData}
                company={qData.companies}
                client={qData.clients}
                items={iData || []}
            />
        )

        // Convert to Buffer
        const buffer = await streamToBuffer(stream)

        // Upload to Supabase Storage
        const fileName = `${companyId}/${qData.number}-${Date.now()}.pdf`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('quote-pdfs')
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (uploadError) {
            console.error('Upload Error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('quote-pdfs')
            .getPublicUrl(fileName)

        // Update Quote Record
        await supabase
            .from('quotes')
            .update({ pdf_url: publicUrl })
            .eq('id', id)

        return NextResponse.json({ success: true, pdf_url: publicUrl })

    } catch (err: any) {
        console.error('API Gen PDF Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
