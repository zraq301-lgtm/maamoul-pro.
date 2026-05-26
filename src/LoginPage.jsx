import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom' // استيراد Navigate
import { createClient } from './utils/supabase/client.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate() // تهيئة المتغير
  
  const supabase = useMemo(() => createClient(), [])

  const handleLogin = async () => {
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      localStorage.setItem("sb-access-token", "true")
      
      alert('تم تسجيل الدخول بنجاح!')
      
      // الانتقال المباشر للمسار الرئيسي بدون إعادة تحميل المتصفح
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg border border-gray-200 bg-white">
      <h1 className="text-2xl font-bold text-center text-gray-800">تسجيل الدخول</h1>
      
      <input 
        type="email" 
        placeholder="البريد الإلكتروني" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <input 
        type="password" 
        placeholder="كلمة المرور" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <button 
        onClick={handleLogin} 
        disabled={loading}
        className={`p-3 rounded-md text-white font-semibold transition-colors ${
          loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'جاري الدخول...' : 'دخول'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-2">
        نظام nawh.ai لإدارة الموارد
      </p>
    </div>
  )
}
