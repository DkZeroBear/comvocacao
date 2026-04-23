-- Limites de tamanho para impedir payloads abusivos via API pública
ALTER TABLE public.credenciamentos
  ADD CONSTRAINT credenciamentos_responsavel_nome_len CHECK (char_length(responsavel_nome) BETWEEN 1 AND 200),
  ADD CONSTRAINT credenciamentos_responsavel_whatsapp_len CHECK (char_length(responsavel_whatsapp) BETWEEN 1 AND 200),
  ADD CONSTRAINT credenciamentos_tipo_len CHECK (char_length(tipo) BETWEEN 1 AND 100),
  ADD CONSTRAINT credenciamentos_nome_banda_len CHECK (nome_banda IS NULL OR char_length(nome_banda) <= 200),
  ADD CONSTRAINT credenciamentos_horario_chegada_len CHECK (horario_chegada IS NULL OR char_length(horario_chegada) <= 100),
  ADD CONSTRAINT credenciamentos_observacoes_len CHECK (observacoes IS NULL OR char_length(observacoes) <= 2000),
  ADD CONSTRAINT credenciamentos_quantidade_range CHECK (quantidade_pessoas BETWEEN 1 AND 1000),
  ADD CONSTRAINT credenciamentos_dias_count CHECK (array_length(dias, 1) BETWEEN 1 AND 10),
  ADD CONSTRAINT credenciamentos_membros_shape CHECK (
    jsonb_typeof(membros) = 'array'
    AND jsonb_array_length(membros) BETWEEN 0 AND 100
    AND pg_column_size(membros) <= 100000
  ),
  ADD CONSTRAINT credenciamentos_veiculos_shape CHECK (
    jsonb_typeof(veiculos) = 'array'
    AND jsonb_array_length(veiculos) BETWEEN 0 AND 50
    AND pg_column_size(veiculos) <= 50000
  );