-- FHIR Healthcare Bootcamp Database Schema

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    role text CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
    fhir_points int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Products table for courses and bootcamps
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    active bool DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Prices table for Stripe integration
CREATE TABLE IF NOT EXISTS prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_sku text REFERENCES products(sku) ON DELETE CASCADE,
    stripe_price_id text UNIQUE NOT NULL,
    currency text DEFAULT 'usd',
    unit_amount int NOT NULL,
    interval text NULL, -- null for one-time, 'month'/'year' for subscriptions
    created_at timestamptz DEFAULT now()
);

-- Purchases table for tracking user purchases
CREATE TABLE IF NOT EXISTS purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_sku text REFERENCES products(sku) ON DELETE CASCADE,
    stripe_subscription_id text NULL,
    status text NOT NULL, -- 'active', 'canceled', 'past_due', etc.
    trial_ends_at timestamptz NULL,
    created_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    summary text,
    requires_product_sku text NULL REFERENCES products(sku),
    is_free bool DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- User enrollments in courses
CREATE TABLE IF NOT EXISTS enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug text REFERENCES courses(slug) ON DELETE CASCADE,
    progress jsonb DEFAULT '{}',
    completed bool DEFAULT false,
    certificate_url text NULL,
    badge_ids text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, course_slug)
);

-- Badges system
CREATE TABLE IF NOT EXISTS badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    points int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- User badge awards
CREATE TABLE IF NOT EXISTS awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_code text REFERENCES badges(code) ON DELETE CASCADE,
    course_slug text NULL REFERENCES courses(slug),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_code)
);

-- Admin bootstrap function
CREATE OR REPLACE FUNCTION grant_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE email = user_email;
    
    -- If no profile exists, this won't update anything
    -- The profile should be created when the user first logs in
END;
$$;