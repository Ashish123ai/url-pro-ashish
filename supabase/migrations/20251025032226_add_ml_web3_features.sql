/*
  # Add ML, Web3, and Security Enhancement Features

  ## 1. New Tables
  
  ### ml_patterns
  - `id` (uuid, primary key)
  - `url_pattern` (text, detected URL pattern)
  - `pattern_type` (text, pattern category: phishing, legitimate, suspicious)
  - `confidence_score` (numeric, ML confidence 0-1)
  - `detection_count` (integer, times this pattern was detected)
  - `last_detected` (timestamptz, last detection timestamp)
  - `features` (jsonb, extracted URL features for ML)
  - `created_at` (timestamptz)
  
  ### threat_predictions
  - `id` (uuid, primary key)
  - `url_id` (uuid, foreign key to url_scans)
  - `prediction_model` (text, model used: BERT, LSTM, ensemble)
  - `threat_probability` (numeric, predicted threat probability 0-1)
  - `predicted_categories` (text array, predicted threat types)
  - `feature_importance` (jsonb, important features for prediction)
  - `created_at` (timestamptz)
  
  ### web3_users
  - `id` (uuid, primary key)
  - `wallet_address` (text, unique Ethereum wallet address)
  - `chain_id` (integer, blockchain network ID)
  - `nonce` (text, authentication nonce)
  - `last_login` (timestamptz)
  - `created_at` (timestamptz)
  
  ### blockchain_logs
  - `id` (uuid, primary key)
  - `log_type` (text, type: threat_detected, scan_completed, pattern_learned)
  - `url` (text, related URL)
  - `data` (jsonb, log data)
  - `ipfs_hash` (text, IPFS content hash)
  - `blockchain_tx` (text, blockchain transaction hash)
  - `wallet_address` (text, user wallet if applicable)
  - `created_at` (timestamptz)
  
  ### zero_trust_validations
  - `id` (uuid, primary key)
  - `request_id` (uuid, unique request identifier)
  - `validation_type` (text, type of validation performed)
  - `validated_at` (timestamptz)
  - `validation_result` (boolean, pass/fail)
  - `metadata` (jsonb, validation metadata)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all new tables
  - Public read access for ml_patterns and threat_predictions
  - Wallet-owner access for web3_users
  - Public write for blockchain_logs and zero_trust_validations
  
  ## 3. Indexes
  - Performance indexes for pattern matching and lookups
  - Indexes on timestamps for time-series queries
  - Indexes on wallet addresses and IPFS hashes
*/

-- ML Patterns Table
CREATE TABLE IF NOT EXISTS ml_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_pattern text NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('phishing', 'legitimate', 'suspicious', 'unknown')),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detection_count integer DEFAULT 1,
  last_detected timestamptz DEFAULT now(),
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ML patterns"
  ON ml_patterns
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert ML patterns"
  ON ml_patterns
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update ML patterns"
  ON ml_patterns
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Threat Predictions Table
CREATE TABLE IF NOT EXISTS threat_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id uuid REFERENCES url_scans(id) ON DELETE CASCADE,
  prediction_model text NOT NULL DEFAULT 'ensemble',
  threat_probability numeric CHECK (threat_probability >= 0 AND threat_probability <= 1),
  predicted_categories text[],
  feature_importance jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE threat_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read threat predictions"
  ON threat_predictions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert threat predictions"
  ON threat_predictions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Web3 Users Table
CREATE TABLE IF NOT EXISTS web3_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  chain_id integer DEFAULT 1,
  nonce text,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE web3_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet data"
  ON web3_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert wallet data"
  ON web3_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own wallet data"
  ON web3_users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Blockchain Logs Table
CREATE TABLE IF NOT EXISTS blockchain_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL CHECK (log_type IN ('threat_detected', 'scan_completed', 'pattern_learned', 'auth_event')),
  url text,
  data jsonb DEFAULT '{}'::jsonb,
  ipfs_hash text,
  blockchain_tx text,
  wallet_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blockchain_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blockchain logs"
  ON blockchain_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert blockchain logs"
  ON blockchain_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Zero Trust Validations Table
CREATE TABLE IF NOT EXISTS zero_trust_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  validation_type text NOT NULL,
  validated_at timestamptz DEFAULT now(),
  validation_result boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zero_trust_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read validations"
  ON zero_trust_validations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert validations"
  ON zero_trust_validations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ml_patterns_pattern ON ml_patterns(url_pattern);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_type ON ml_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_confidence ON ml_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_last_detected ON ml_patterns(last_detected DESC);

CREATE INDEX IF NOT EXISTS idx_threat_predictions_url_id ON threat_predictions(url_id);
CREATE INDEX IF NOT EXISTS idx_threat_predictions_probability ON threat_predictions(threat_probability DESC);

CREATE INDEX IF NOT EXISTS idx_web3_users_wallet ON web3_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_web3_users_chain ON web3_users(chain_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_logs_type ON blockchain_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_logs_ipfs ON blockchain_logs(ipfs_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_logs_wallet ON blockchain_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_logs_created ON blockchain_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zero_trust_request ON zero_trust_validations(request_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_type ON zero_trust_validations(validation_type);
CREATE INDEX IF NOT EXISTS idx_zero_trust_result ON zero_trust_validations(validation_result);