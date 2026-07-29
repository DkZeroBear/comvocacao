UPDATE public.credenciamentos SET tipo = 'Prefeitura / Convidados', setor = NULL WHERE setor = 'prefeitura';

ALTER TABLE public.credenciamentos DROP CONSTRAINT IF EXISTS setor_valido;

ALTER TABLE public.credenciamentos ADD CONSTRAINT setor_valido
CHECK (
  setor IS NULL OR setor IN ('palco', 'camarim', 'press', 'tecnica')
);