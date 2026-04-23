ALTER TABLE public.credenciamentos
  ADD COLUMN IF NOT EXISTS eh_produtor boolean,
  ADD COLUMN IF NOT EXISTS pode_contatar boolean;