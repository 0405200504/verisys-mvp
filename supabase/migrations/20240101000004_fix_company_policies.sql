DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;
CREATE POLICY "Users can view their companies" ON public.companies FOR SELECT USING (is_member_of(id) OR auth.uid() = owner_id);
