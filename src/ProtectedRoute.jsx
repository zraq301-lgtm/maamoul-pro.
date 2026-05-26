import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createClient } from './utils/supabase/client';

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // الاستماع لأي تغييرات في حالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) return <div>جاري التحميل...</div>;

  // إذا لم توجد جلسة، أعد توجيه المستخدم لصفحة تسجيل الدخول
  if (!session) return <Navigate to="/login" replace />;

  // إذا كانت الجلسة موجودة، اعرض محتوى التطبيق
  return children;
}
