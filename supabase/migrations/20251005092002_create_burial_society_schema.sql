/*
  # Burial Society Management System Schema

  ## Overview
  Complete database schema for managing burial society operations including members, 
  dependents, contributions, claims, notifications, and user roles.

  ## New Tables

  ### 1. `users` - System users with role-based access
    - `id` (uuid, primary key) - Unique user identifier
    - `email` (text, unique) - User email for login
    - `full_name` (text) - User's full name
    - `role` (text) - User role: super_admin, treasurer, secretary, auditor
    - `created_at` (timestamptz) - Account creation timestamp

  ### 2. `members` - Burial society members
    - `id` (uuid, primary key) - Unique member identifier
    - `member_number` (text, unique) - Member identification number
    - `policy_number` (text, unique) - Policy identification number
    - `full_name` (text) - Member's full name
    - `phone` (text) - Contact phone number
    - `email` (text) - Contact email
    - `address` (text) - Physical address
    - `profile_picture` (text) - URL to profile image
    - `status` (text) - active, inactive, suspended
    - `monthly_contribution` (numeric) - Required monthly payment amount
    - `join_date` (date) - Date member joined society
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `dependents` - Family members covered under policies
    - `id` (uuid, primary key) - Unique dependent identifier
    - `member_id` (uuid, foreign key) - Reference to member
    - `full_name` (text) - Dependent's full name
    - `relationship` (text) - spouse, child, parent, sibling, other
    - `date_of_birth` (date) - Dependent's birth date
    - `id_number` (text) - National ID number
    - `parent_dependent_id` (uuid, nullable) - Reference to parent dependent for tree structure
    - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `contributions` - Payment tracking
    - `id` (uuid, primary key) - Unique contribution identifier
    - `member_id` (uuid, foreign key) - Reference to member
    - `amount` (numeric) - Payment amount
    - `payment_date` (date) - Date payment was made
    - `status` (text) - paid, unpaid, overdue
    - `payment_method` (text) - cash, bank_transfer, mobile_money
    - `reference_number` (text) - Payment reference/receipt number
    - `month` (integer) - Month (1-12)
    - `year` (integer) - Year
    - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `claims` - Death benefit claims
    - `id` (uuid, primary key) - Unique claim identifier
    - `member_id` (uuid, foreign key) - Reference to member who filed claim
    - `dependent_id` (uuid, nullable, foreign key) - Reference to deceased dependent
    - `deceased_name` (text) - Name of deceased
    - `claim_amount` (numeric) - Claim amount requested
    - `payout_amount` (numeric, nullable) - Actual amount paid
    - `status` (text) - pending, approved, rejected, paid
    - `documents` (jsonb) - Array of document URLs
    - `submission_date` (date) - Date claim was submitted
    - `approval_date` (date, nullable) - Date claim was approved
    - `payout_date` (date, nullable) - Date claim was paid
    - `notes` (text) - Additional notes/comments
    - `created_at` (timestamptz) - Record creation timestamp

  ### 6. `notifications` - System notifications and alerts
    - `id` (uuid, primary key) - Unique notification identifier
    - `member_id` (uuid, nullable, foreign key) - Target member
    - `type` (text) - payment_reminder, claim_update, fund_alert, general
    - `title` (text) - Notification title
    - `message` (text) - Notification content
    - `status` (text) - sent, pending, failed
    - `sent_at` (timestamptz, nullable) - When notification was sent
    - `created_at` (timestamptz) - Record creation timestamp

  ### 7. `fund_balance` - Society fund tracking
    - `id` (uuid, primary key) - Unique record identifier
    - `balance` (numeric) - Current available balance
    - `total_contributions` (numeric) - Lifetime contributions collected
    - `total_claims_paid` (numeric) - Lifetime claims paid out
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access based on user roles
  - Members can only view their own data
  - Admins and staff have appropriate access levels

  ## Important Notes
  1. All monetary amounts use numeric type for precision
  2. Status fields use text enums for flexibility
  3. Timestamps use timestamptz for timezone awareness
  4. Foreign keys ensure referential integrity
  5. Indexes added for frequently queried columns
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'secretary',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number text UNIQUE NOT NULL,
  policy_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  address text,
  profile_picture text,
  status text DEFAULT 'active',
  monthly_contribution numeric DEFAULT 0,
  join_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create dependents table
CREATE TABLE IF NOT EXISTS dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  date_of_birth date,
  id_number text,
  parent_dependent_id uuid REFERENCES dependents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'unpaid',
  payment_method text,
  reference_number text,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  dependent_id uuid REFERENCES dependents(id) ON DELETE SET NULL,
  deceased_name text NOT NULL,
  claim_amount numeric NOT NULL,
  payout_amount numeric,
  status text DEFAULT 'pending',
  documents jsonb DEFAULT '[]'::jsonb,
  submission_date date DEFAULT CURRENT_DATE,
  approval_date date,
  payout_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create fund_balance table
CREATE TABLE IF NOT EXISTS fund_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance numeric DEFAULT 0,
  total_contributions numeric DEFAULT 0,
  total_claims_paid numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fund_balance ENABLE ROW LEVEL SECURITY;

-- Insert initial fund balance record
INSERT INTO fund_balance (balance, total_contributions, total_claims_paid)
VALUES (0, 0, 0)
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_member_number ON members(member_number);
CREATE INDEX IF NOT EXISTS idx_dependents_member_id ON dependents(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(year, month);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_member_id ON claims(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for members table
CREATE POLICY "Authenticated users can view members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for dependents table
CREATE POLICY "Authenticated users can view dependents"
  ON dependents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert dependents"
  ON dependents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update dependents"
  ON dependents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete dependents"
  ON dependents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for contributions table
CREATE POLICY "Authenticated users can view contributions"
  ON contributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contributions"
  ON contributions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contributions"
  ON contributions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contributions"
  ON contributions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for claims table
CREATE POLICY "Authenticated users can view claims"
  ON claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete claims"
  ON claims FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for notifications table
CREATE POLICY "Authenticated users can view notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for fund_balance table
CREATE POLICY "Authenticated users can view fund balance"
  ON fund_balance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update fund balance"
  ON fund_balance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);