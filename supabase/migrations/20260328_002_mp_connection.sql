CREATE TABLE IF NOT EXISTS public.mp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  mp_user_id BIGINT NOT NULL,
  mp_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mp_connections_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.mp_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mp_connection_id UUID NOT NULL REFERENCES public.mp_connections(id) ON DELETE CASCADE,
  mp_payment_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ NOT NULL,
  date_approved TIMESTAMPTZ,
  status TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  description TEXT,
  payer_email TEXT,
  payer_name TEXT,
  payment_method_id TEXT,
  payment_type_id TEXT,
  operation_type TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mp_movements_user_payment_key UNIQUE (user_id, mp_payment_id)
);

ALTER TABLE public.mp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mp_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_own_mp_connections"
  ON public.mp_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_access_own_mp_movements"
  ON public.mp_movements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mp_connections_user_active
  ON public.mp_connections(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_mp_movements_user_date
  ON public.mp_movements(user_id, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_mp_movements_connection_status
  ON public.mp_movements(mp_connection_id, status);
