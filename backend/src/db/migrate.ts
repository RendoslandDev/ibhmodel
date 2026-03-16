import { pool } from './pool';
import dotenv from 'dotenv';
dotenv.config();

const migration = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Info
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender        VARCHAR(50) NOT NULL,
  nationality   VARCHAR(100),
  location      VARCHAR(150) NOT NULL,

  -- Contact
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(50) NOT NULL,
  instagram     VARCHAR(100),
  portfolio_url VARCHAR(500),

  -- Measurements
  height_cm     NUMERIC(5,1),
  weight_kg     NUMERIC(5,1),
  bust_cm       NUMERIC(5,1),
  waist_cm      NUMERIC(5,1),
  hips_cm       NUMERIC(5,1),
  shoe_size_eu  NUMERIC(4,1),
  hair_color    VARCHAR(50),
  eye_color     VARCHAR(50),
  skin_tone     VARCHAR(50),

  -- Modeling
  categories    TEXT[] NOT NULL DEFAULT '{}',
  experience    VARCHAR(100),
  prev_agency   VARCHAR(255),
  campaigns     TEXT,
  bio           TEXT NOT NULL,

  -- Availability
  availability  VARCHAR(50),
  travel_pref   VARCHAR(50),
  hear_about    VARCHAR(50),
  emergency_contact VARCHAR(200),

  -- Photos (S3 keys)
  photo_keys    TEXT[] DEFAULT '{}',
  photo_urls    TEXT[] DEFAULT '{}',

  -- Status
  status        VARCHAR(30) NOT NULL DEFAULT 'pending',
  admin_notes   TEXT,
  reviewed_by   UUID,
  reviewed_at   TIMESTAMPTZ,

  -- Agreement
  agreement_sent     BOOLEAN DEFAULT FALSE,
  agreement_sent_at  TIMESTAMPTZ,
  agreement_signed   BOOLEAN DEFAULT FALSE,
  agreement_pdf_key  VARCHAR(500),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'reviewer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,
  action         VARCHAR(100) NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_status   ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email    ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created  ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_application  ON activity_log(application_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database migration...');
    await client.query(migration);
    console.log('✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
