import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  website_id: string | null;
  scan_type: 'website' | 'screenshot';
  url: string | null;
  html_content: string | null;
  ocr_text: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface DarkPattern {
  id: string;
  scan_id: string;
  user_id: string;
  pattern_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string | null;
  element_text: string | null;
  element_selector: string | null;
  recommendation: string | null;
  location_x: number | null;
  location_y: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface DetectionStats {
  id: string;
  user_id: string;
  total_websites_analyzed: number;
  total_patterns_detected: number;
  last_scan_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null;
}

export interface ScanWithPatterns extends Scan {
  dark_patterns: DarkPattern[];
}

// Admin credentials check (client-side for routing purposes)
export const ADMIN_EMAIL = 'AndrewsOsei1@gmail.com';
