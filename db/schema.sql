-- Cheers veritabanı şeması (PostgreSQL 14+)
-- Çalıştırma: npm run db:migrate   (tekrar çalıştırmak güvenlidir)
-- İçerik (eller, sözlük, blog) depoda sürümlenen dosyalardadır; veritabanı yalnızca
-- kullanıcıya ait veriyi ve yapay zeka önbelleğini tutar. Böylece KVKK kapsamındaki
-- veri tek yerde toplanır ve hesap silindiğinde CASCADE ile tamamen temizlenir.

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,                 -- scrypt; Google ile girişte NULL
  google_sub    TEXT UNIQUE,
  display_name  TEXT,
  consent_at    TIMESTAMPTZ NOT NULL, -- 18+ beyanı ve aydınlatma metni onayı
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,        -- çerezdeki rastgele token'ın SHA-256'sı
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

-- Alıştırma cevapları: her satır bir soruya verilen bir cevap
CREATE TABLE IF NOT EXISTS attempts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hand_id    TEXT NOT NULL,
  chosen     SMALLINT NOT NULL,
  correct    BOOLEAN NOT NULL,
  topic      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts(user_id, created_at DESC);
-- Tam döküm (/api/attempts/export) id sırasıyla sayfalanır
CREATE INDEX IF NOT EXISTS attempts_user_id_idx ON attempts(user_id, id DESC);

-- Kaydedilen eller ve kullanıcının o ele düştüğü not
CREATE TABLE IF NOT EXISTS saved_hands (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hand_id    TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hand_id)
);

-- Sık sorulan soruların yanıt önbelleği (kişisel veri içermez: anahtar bir özet)
CREATE TABLE IF NOT EXISTS ai_cache (
  key        TEXT PRIMARY KEY,
  answer     TEXT NOT NULL,
  hits       INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
