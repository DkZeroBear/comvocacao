ALTER TABLE public.credenciamentos ADD COLUMN setor text;

ALTER TABLE public.credenciamentos ADD CONSTRAINT setor_valido
CHECK (
  setor IS NULL OR setor IN ('palco', 'camarim', 'press', 'tecnica', 'prefeitura')
);