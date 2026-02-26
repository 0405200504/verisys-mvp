DROP POLICY IF EXISTS "Owners can insert members" ON public.company_members;

CREATE POLICY "Owners can insert members" ON public.company_members FOR INSERT WITH CHECK (
  is_owner_of(company_id) 
  OR 
  (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()))
);
