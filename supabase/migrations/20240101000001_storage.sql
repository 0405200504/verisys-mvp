-- Create the storage bucket for PDF quotes
insert into storage.buckets (id, name, public) 
values ('quote-pdfs', 'quote-pdfs', true);

-- Policy to allow authenticated users to upload PDFs
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'quote-pdfs'
);

-- Policy to allow public reads for the PDFs
create policy "Allow public read"
on storage.objects for select
to public
using (
  bucket_id = 'quote-pdfs'
);

-- Policy to allow authenticated users to update/delete their PDFs
create policy "Allow authenticated update and delete"
on storage.objects for all
to authenticated
using (
  bucket_id = 'quote-pdfs'
);
