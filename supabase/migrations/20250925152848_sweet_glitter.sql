/*
  # Create scan history table

  1. New Tables
    - `scan_history`
      - `id` (uuid, primary key)
      - `url` (text, the scanned URL)
      - `is_phishing` (boolean, phishing detection result)
      - `threat_score` (integer, threat score 0-100)
      - `ssl_data` (jsonb, SSL certificate information)
      - `domain_data` (jsonb, domain information)
      - `ip_data` (jsonb, IP address information)
      - `reputation_data` (jsonb, reputation check results)
      - `scan_timestamp` (timestamptz, when the scan was performed)
      - `user_ip` (text, IP of user who performed scan)
      - `created_at` (timestamptz, record creation time)

  2. Security
    - Enable RLS on `scan_history` table
    - Add policy for public read access to scan results
    - Add policy for public insert access for new scans

  3. Indexes
    - Add index on url for faster lookups
    - Add index on scan_timestamp for chronological queries
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  is_phishing boolean NOT NULL DEFAULT false,
  threat_score integer NOT NULL DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  ssl_data jsonb DEFAULT '{}',
  domain_data jsonb DEFAULT '{}',
  ip_data jsonb DEFAULT '{}',
  reputation_data jsonb DEFAULT '{}',
  scan_timestamp timestamptz NOT NULL DEFAULT now(),
  user_ip text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to scan results
CREATE POLICY "Public can read scan results"
  ON scan_history
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert for new scans
CREATE POLICY "Public can insert scan results"
  ON scan_history
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_history_url ON scan_history(url);
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(scan_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_threat_score ON scan_history(threat_score DESC);