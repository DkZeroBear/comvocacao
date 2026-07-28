CREATE POLICY "Only admins can update credenciamentos"
ON public.credenciamentos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.credenciamentos TO authenticated;