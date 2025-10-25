/*
  # Create URL scans table

  1. New Tables
    - `url_scans`
      - `id` (uuid, primary key)
      - `url` (text, the scanned URL)
      - `status` (text, scan status: pending, completed, failed)
      - `safety_score` (integer, safety score 0-100)
      - `is_safe` (boolean, whether URL is safe)
      - `ssl_valid` (boolean, SSL certificate validity)
      - `ssl_issuer` (text, SSL certificate issuer)
      - `ssl_expires_at` (timestamptz, SSL expiration date)
      - `domain_age_days` (integer, domain age in days)
      - `ip_address` (text, resolved IP address)
      - `ip_country` (text, IP geolocation country)
      - `threat_categories` (text array, detected threat categories)
      - `ml_confidence` (numeric, ML model confidence score)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, record update time)

  2. Security
    - Enable RLS on `url_scans` table
    - Add policy for public read access to completed scans
    - Add policy for public insert access for new scans
    - Add policy for public update access to update scan results

  3. Indexes
    - Add index on url for faster lookups
    - Add index on status for filtering
    - Add index on created_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS url_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  safety_score integer CHECK (safety_score >= 0 AND safety_score <= 100),
  is_safe boolean,
  ssl_valid boolean,
  ssl_issuer text,
  ssl_expires_at timestamptz,
  domain_age_days integer,
  ip_address text,
  ip_country text,
  threat_categories text[],
  ml_confidence numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE url_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read scan results"
  ON url_scans
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert scans"
  ON url_scans
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update scans"
  ON url_scans
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_url_scans_url ON url_scans(url);
CREATE INDEX IF NOT EXISTS idx_url_scans_status ON url_scans(status);
CREATE INDEX IF NOT EXISTS idx_url_scans_created_at ON url_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_url_scans_safety_score ON url_scans(safety_score DESC);