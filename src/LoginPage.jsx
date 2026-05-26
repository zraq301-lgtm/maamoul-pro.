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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      alert('تم تسجيل الدخول بنجاح!')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-8 max-w-md mx-auto mt-10 shadow-lg rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold text-center text-gray-800">تسجيل الدخول</h1>
      
      <input 
        type="email" 
        placeholder="البريد الإلكتروني" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-3 rounded-md w-full"
      />
      
      <input 
        type="password" 
        placeholder="كلمة المرور" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-3 rounded-md w-full"
      />
      
      <button 
        onClick={handleLogin} 
        disabled={loading}
        className={`p-3 rounded-md text-white font-semibold transition-colors ${
          loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'جاري الدخول...' : 'دخول'}
      </button>
    </div>
  )
}
