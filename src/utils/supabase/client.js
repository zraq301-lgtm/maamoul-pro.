import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_URL'; // ضع رابط المشروع الخاص بك هنا
const supabaseAnonKey = 'YOUR_KEY'; // ضع مفتاح ANON الخاص بك هنا

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // استخدام localStorage لبيئة الويب، وفي حال واجهت مشاكل في APK 
      // يمكن استخدام localStorage.setItem/getItem كـ Storage interface
      storage: localStorage, 
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
};
