import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Calendar } from 'lucide-react';

export default function NawahLiveViewer() {
  const [databaseRecords, setDatabaseRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNawahDatabase = async () => {
    try {
      // الرابط المباشر لملف البيانات من مستودع الـ GitHub الخاص بك
      const rawUrl = "https://raw.githubusercontent.com/zraq301-lgtm/Nawah-AI-db/main/database/nawah-core.json";
      
      // إضافة تذيل زمني لمنع الكاش لضمان جلب البيانات الحية فوراً
      const response = await fetch(`${rawUrl}?t=${new Date().getTime()}`);
      
      if (!response.ok) {
        throw new Error("لم نتمكن من الوصول لملف البيانات الحية");
      }
      
      const jsonResult = await response.json();
      
      // نتحقق إذا كانت البيانات مصفوفة مباشرة أو داخل كائن مسمى
      const records = Array.isArray(jsonResult) ? jsonResult : (jsonResult.records || []);
      setDatabaseRecords(records);
      setError(null);
    } catch (err) {
      console.error("خطأ في جلب بيانات نواة:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // تشغيل الجلب فور فتح الشاشة
    fetchNawahDatabase();

    // عمل تحديث تلقائي (Live Polling) كل 15 ثانية لمراقبة التحديثات القادمة
    const liveInterval = setInterval(fetchNawahDatabase, 15000);
    return () => clearInterval(liveInterval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-slate-400 animate-pulse text-base">جاري الاتصال بقاعدة بيانات Nawah-AI الحية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-950 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-rose-500 mb-4">حدث خطأ أثناء مزامنة البيانات: {error}</p>
        <button onClick={fetchNawahDatabase} className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-950 min-h-screen" dir="rtl">
      {/* الهيدر العلوي */}
      <div className="mb-6 pt-12">
        <h1 className="text-xl font-bold text-white mb-1">سجل العمليات الحية (Nawah Core)</h1>
        <p className="text-slate-500 text-xs">يتم التحديث تلقائياً عند إرسال أي ملف JSON جديد</p>
      </div>

      {/* شبكة عرض كروت البيانات */}
      <div className="grid grid-cols-1 gap-4 mb-24">
        {databaseRecords.length === 0 ? (
          <p className="text-slate-500 text-center py-10">لا توجد سجلات محفوظة حالياً في nawah-core</p>
        ) : (
          databaseRecords.map((record) => (
            <div 
              key={record.id}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {/* تغيير لون الأيقونة حسب نوع القسم ليتماشى مع الشاشة الرئيسية */}
                  <div className={`p-2 rounded-lg ${
                    record.module_type === 'purchases' ? 'bg-amber-500/10 text-amber-500' :
                    record.module_type === 'sales' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {record.module_type === 'purchases' ? <ShoppingCart className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">
                      {record.vendor_name || record.customer_name || "عملية غير معرفة"}
                    </h3>
                    <span className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {record.date}
                    </span>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 font-mono">
                  #{record.id}
                </span>
              </div>

              {/* السعر والإجمالي تحت */}
              <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-xs text-slate-500">حالة المزامنة: <span className="text-emerald-400">Live</span></span>
                <div className="text-left">
                  <span className="text-emerald-400 font-bold text-base">
                    {record.total_amount} {record.currency || 'USD'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
