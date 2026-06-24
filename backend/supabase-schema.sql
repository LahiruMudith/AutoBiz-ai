-- Supabase SQL Schema for AutoBiz
-- Run this in the Supabase SQL Editor

-- 1. Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  whatsapp_number TEXT,
  whatsapp_token TEXT,
  phone_number_id TEXT,
  welcome_message TEXT,
  return_policy TEXT,
  delivery_fee NUMERIC DEFAULT 0,
  faqs JSONB DEFAULT '[]'::jsonb,
  subscription JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category TEXT,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  PRIMARY KEY (business_id, id)
);

-- 3. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  language TEXT DEFAULT 'English',
  tags JSONB DEFAULT '[]'::jsonb,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  PRIMARY KEY (business_id, id)
);

-- 4. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  unread BOOLEAN DEFAULT FALSE,
  ai_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (business_id, id)
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (business_id, conversation_id, id),
  FOREIGN KEY (business_id, conversation_id) REFERENCES conversations(business_id, id) ON DELETE CASCADE
);

-- 6. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (business_id, id)
);

-- Enable RLS (Row Level Security) if desired, but for this admin SDK proxy it is not required by default.
-- You can set up policies according to your deployment needs.
