import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Table as TableIcon, LayoutGrid, Trash2 } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  
  // دالة لتوليد سطر فارغ بتنسيق الإكسل
  const createEmptyRow = () => ({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    date: new Date().toISOString().split('T')[0], // تاريخ اليوم افتراضياً
    balance: '',
    price: '',
    isNew: true
  });

  const [gridData, setGridData] = useState([]);

  // تحميل البيانات لأول مرة فقط عند فتح المكون أو تغيير القسم
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw' 
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
    
    // تحويل البيانات القادمة لشكل يقبله الجدول مع إضافة صفوف فارغة
    const initialRows = filtered.map(cat => ({
      id: cat.id || Math.random(),
      name: cat.name || '',
      date: cat.date || new Date().toISOString().split('T')[0],
      balance: cat.balance || '',
      price: cat.price || '',
      isNew: false
    }));

    setGridData([...initialRows, ...Array(5).fill(null).map(createEmptyRow)]);
  }, [activeTab]); // التغيير فقط عند تبديل القسم (مواد خام / منتج نهائي)

  // دالة معالجة التغيير وفتح خانات جديدة تلقائياً
  const handleCellChange = (id, field, value) => {
    const updatedData = gridData.map((item, index) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        
        // إذا كتب المستخدم في آخر سطر، أضف سطر جديد تلقائياً
        if (index === gridData.length - 1 && value !== '') {
          setTimeout(() => {
            setGridData(prev => [...prev, createEmptyRow()]);
          }, 0);
        }
        return newItem;
      }
      return item;
    });
    setGridData(updatedData);
  };

  const deleteRow = (id) => {
    setGridData(gridData.filter(item => item.id !== id));
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f4f7f6', paddingBottom: '100px' }}>
      
      {/* الهيدر */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '10px', borderRadius: '12px' }}>
              <FileSpreadsheet size={24} />
           </div>
           <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>دفتر المعمول الذكي</h2>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={22} />
        </button>
      </div>

      {/* التحكم في الأقسام */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#1e5631' : '#fff', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold' }}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#1e5631' : '#fff', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold' }}>المنتج النهائي</button>
      </div>

      {/* الجدول التفاعلي (إكسل) */}
      <div style={{ background: '#fff', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ width: '50px', padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>#</th>
                <th style={{ borderLeft: '1px solid #e2e8f0', padding: '10px', textAlign: 'right', color: '#1e5631' }}>البيان (الصنف)</th>
                <th style={{ borderLeft: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', color: '#1e5631' }}>التاريخ</th>
                <th style={{ borderLeft: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', color: '#1e5631' }}>الكمية</th>
                <th style={{ borderLeft: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', color: '#1e5631' }}>السعر</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#1e5631' }}>الإجمالي</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: item.name ? '#fff' : '#fafafa' }}>
                  <td style={{ textAlign: 'center', background: '#f8fafc', color: '#cbd5e1', fontSize: '0.75rem' }}>{index + 1}</td>
                  
                  {/* عمود البيان */}
                  <td style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <input 
                      value={item.name} 
                      onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '12px', outline: 'none', background: 'transparent' }}
                      placeholder="اكتب هنا..."
                    />
                  </td>

                  {/* عمود التاريخ */}
                  <td style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <input 
                      type="date"
                      value={item.date} 
                      onChange={(e) => handleCellChange(item.id, 'date', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '12px', outline: 'none', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}
                    />
                  </td>

                  {/* عمود الكمية */}
                  <td style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <input 
                      type="number"
                      value={item.balance} 
                      onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '12px', outline: 'none', textAlign: 'center' }}
                    />
                  </td>

                  {/* عمود السعر */}
                  <td style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <input 
                      type="number"
                      value={item.price} 
                      onChange={(e) => handleCellChange(item.id, 'price', e.target.value)}
                      style={{ width: '100%', border: 'none', padding: '12px', outline: 'none', textAlign: 'center' }}
                    />
                  </td>

                  {/* عمود الإجمالي */}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#1e5631', background: item.name ? '#f0fdf4' : 'transparent' }}>
                    {(parseFloat(item.balance || 0) * parseFloat(item.price || 0)).toLocaleString()}
                  </td>

                  {/* زر حذف السطر */}
                  <td style={{ textAlign: 'center' }}>
                    {item.name && (
                      <button onClick={() => deleteRow(item.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* زر حفظ البيانات النهائي (اختياري) */}
      <button 
        onClick={() => console.log("بيانات جاهزة للحفظ:", gridData.filter(i => i.name))}
        style={{ position: 'fixed', bottom: '30px', left: '20px', right: '20px', background: '#1e5631', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(30, 86, 49, 0.3)', fontSize: '1rem' }}
      >
        حفظ تحديثات الشيت 💾
      </button>

    </div>
  );
};

export default Inventory;
