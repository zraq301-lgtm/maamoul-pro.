import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from './utils/supabase/client.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // عند نجاح العملية، ننتقل فوراً للمسار الرئيسي
      // استخدام { replace: true } يمنع المستخدم من العودة لصفحة الدخول بالضغط على زر الرجوع
      navigate('/', { replace: true });
      
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg border border-gray-200 bg-white">
      <h1 className="text-2xl font-bold text-center text-gray-800">تسجيل الدخول</h1>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="البريد الإلكتروني" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <button 
          type="submit"
          disabled={loading}
          className={`p-3 rounded-md text-white font-semibold transition-colors ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
