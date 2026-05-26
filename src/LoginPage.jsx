'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    
    // عملية تسجيل الدخول عبر Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      // حفظ حالة تسجيل الدخول محلياً ليتمكن التطبيق من السماح بالمرور
      localStorage.setItem("sb-access-token", "true")
      
      alert('تم تسجيل الدخول بنجاح!')
      
      // العودة للصفحة الرئيسية (التطبيق)
      window.location.href = '/'
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
