/*
  # Create GalPal Medical Analysis Schema

  ## Overview
  Creates the core database structure for the GalPal medical analysis application,
  including patient profiles and medical test analysis results.

  ## New Tables
  
  ### `patient_profiles`
  Stores patient demographic and medical information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Patient full name
  - `age` (integer) - Patient age
  - `sex` (text) - Patient biological sex (male/female/other)
  - `mrn` (text, nullable) - Medical Record Number
  - `date_of_birth` (date, nullable) - Date of birth
  - `contact_email` (text, nullable) - Contact email
  - `contact_phone` (text, nullable) - Contact phone
  - `medical_history` (text, nullable) - Medical history notes
  - `current_medications` (text, nullable) - Current medications
  - `allergies` (text, nullable) - Known allergies
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `user_id` (uuid, nullable) - Associated user ID for multi-user support
  
  ### `medical_analyses`
  Stores medical test analysis results and AI interpretations
  - `id` (uuid, primary key) - Unique identifier
  - `patient_id` (uuid, foreign key) - Reference to patient_profiles
  - `fluid_type` (text) - Type of test (blood/urine)
  - `test_date` (date) - Date test was performed
  - `metrics` (jsonb) - Test result metrics
  - `ai_summary` (text) - AI-generated summary
  - `ai_interpretation` (text) - Detailed AI interpretation
  - `detected_conditions` (jsonb) - AI-detected health conditions
  - `risk_factors` (jsonb) - Identified risk factors
  - `recommendations` (text) - AI recommendations
  - `notes` (text, nullable) - User notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Public read/write access for demo purposes (can be restricted per user in production)
*/

-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 0 AND age <= 150),
  sex text NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  mrn text,
  date_of_birth date,
  contact_email text,
  contact_phone text,
  medical_history text,
  current_medications text,
  allergies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

-- Create medical_analyses table
CREATE TABLE IF NOT EXISTS medical_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  fluid_type text NOT NULL CHECK (fluid_type IN ('blood', 'urine')),
  test_date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  ai_interpretation text,
  detected_conditions jsonb DEFAULT '[]'::jsonb,
  risk_factors jsonb DEFAULT '[]'::jsonb,
  recommendations text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_profiles_name ON patient_profiles(name);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_created_at ON patient_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_analyses_patient_id ON medical_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_analyses_test_date ON medical_analyses(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_analyses_created_at ON medical_analyses(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_patient_profiles_updated_at
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_analyses_updated_at
  BEFORE UPDATE ON medical_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient_profiles
-- Allow public read access (for demo - restrict in production)
CREATE POLICY "Allow public read access to patient profiles"
  ON patient_profiles FOR SELECT
  TO public
  USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert to patient profiles"
  ON patient_profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update to patient profiles"
  ON patient_profiles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete from patient profiles"
  ON patient_profiles FOR DELETE
  TO public
  USING (true);

-- Create RLS policies for medical_analyses
-- Allow public read access
CREATE POLICY "Allow public read access to medical analyses"
  ON medical_analyses FOR SELECT
  TO public
  USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert to medical analyses"
  ON medical_analyses FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update to medical analyses"
  ON medical_analyses FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete from medical analyses"
  ON medical_analyses FOR DELETE
  TO public
  USING (true);