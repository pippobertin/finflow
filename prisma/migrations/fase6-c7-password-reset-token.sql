-- Fase 6.C7: tabella password_reset_token nello schema finflow
-- Eseguire manualmente in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS finflow.password_reset_token (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES public.fin_user(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_token_user_id ON finflow.password_reset_token(user_id);
CREATE INDEX idx_password_reset_token_expires ON finflow.password_reset_token(expires_at) WHERE used_at IS NULL;
