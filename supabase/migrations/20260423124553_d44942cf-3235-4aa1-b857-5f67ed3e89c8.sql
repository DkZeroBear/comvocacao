-- Enum para papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de papéis (separada para evitar escalada de privilégio)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para checar papel sem recursão
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas: usuários veem seus próprios papéis; admins veem tudo
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atualiza políticas de credenciamentos:
-- 1) Mantém INSERT público (formulário aberto)
-- 2) Restringe SELECT apenas para admins
DROP POLICY IF EXISTS "Anyone can read credenciamentos" ON public.credenciamentos;

CREATE POLICY "Only admins can read credenciamentos"
ON public.credenciamentos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));