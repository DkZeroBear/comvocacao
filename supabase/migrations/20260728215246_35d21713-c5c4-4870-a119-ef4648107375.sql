CREATE POLICY "Only admins can delete credenciamentos"
ON public.credenciamentos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));