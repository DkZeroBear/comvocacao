
CREATE TABLE public.credenciamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  dias TEXT[] NOT NULL,
  responsavel_nome TEXT NOT NULL,
  responsavel_whatsapp TEXT NOT NULL,
  nome_banda TEXT,
  horario_chegada TEXT,
  quantidade_pessoas INTEGER NOT NULL,
  observacoes TEXT,
  membros JSONB NOT NULL DEFAULT '[]'::jsonb,
  veiculos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credenciamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert credenciamentos"
  ON public.credenciamentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read credenciamentos"
  ON public.credenciamentos FOR SELECT
  TO anon, authenticated
  USING (true);
