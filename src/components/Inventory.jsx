import React, { useState, useRef } from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw, FileUp, Download, Trash2, Plus } from 'lucide-react';
import * as XLSX from 'xlsx'; // تأكد من تثبيت المكتبة: npm install xlsx

const InventoryERP = ({ onBack }) => {
  // بيانات تجريبية لمحاكاة قاعدة بيانات ERP
  const [categories, setCategories] = useState([
    { id: 1, name: 'أسمنت لافارج', balance: 50, price: 150, unit: 'طن' },
    { id: 2, name: 'حديد عز 12مم', balance: 5, price: 40000, unit: 'طن' },
  ]);

  const fileInputRef = useRef(null);

  // --- وظائف نظام الـ ERP ---

  // 1. استيراد من إكسيل
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // دمج البيانات الجديدة مع القديمة
      const formattedData = data.map((item, index) => ({
        id: Date.now() + index,
        name: item.الاسم || item.name,
        balance: Number(item.الرصيد || item.balance || 0),
        price: Number(item.السعر || item.price || 0),
        unit: item.الوحدة || item.unit || 'وحدة'
      }));
      setCategories([...categories, ...formattedData]);
    };
    reader.readAsBinaryString(file);
  };

  // 2. تصدير للـ Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(categories);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "المخزن_الحالي.xlsx");
  };

  // 3. حذف صنف
  const deleteItem = (id) => {
    setCategories(categories.filter(item => item.id !== id));
  };

  const styles = {
    container: { padding: '20px', direction: 'rtl', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Segoe UI', Tahoma, sans-serif", backgroundColor: '#f1f5f9', minHeight: '100vh' },
    headerCard: { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
    btnSuccess: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
    shelfGrid: { display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' },
    shelfItem: (balance) => ({
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      borderRight: `8px solid ${balance <= 0 ? '#ef4444' : balance < 10 ? '#f59e0b' : '#3b82f6'}`,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }),
    badge: (bg, color) => ({ backgroundColor: bg, color: color, padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' })
  };

  return (
    <div style={styles.container}>
      {/* رأس نظام الـ ERP */}
      <div style={styles.headerCard}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers color="#2563eb" /> نظام إدارة المخازن الاحترافي
          </h2>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>لوحة تحكم ذكية للأرصدة والتكاليف</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            accept=".xlsx, .xls"
          />
          <button onClick={() => fileInputRef.current.click()} style={styles.btnPrimary}>
            <FileUp size={18} /> استيراد Excel
          </button>
          <button onClick={exportToExcel} style={styles.btnSuccess}>
            <Download size={18} /> تصدير تقرير
          </button>
        </div>
      </div>

      {/* عرض البيانات */}
      <div style={styles.shelfGrid}>
        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '100px', background: 'white', borderRadius: '20px' }}>
            <AlertCircle size={60} color="#cbd5e1" />
            <p style={{ color: '#64748b', marginTop: '15px' }}>لا توجد بيانات حالياً، ابدأ برفع ملف إكسيل أو إضافة أصناف.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const currentBalance = cat.balance || 0;
            const totalPrice = currentBalance * (cat.price || 0);
            
            return (
              <div key={cat.id} style={styles.shelfItem(currentBalance)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#334155' }}>{cat.name}</div>
                  <button 
                    onClick={() => deleteItem(cat.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ color: '#64748b' }}>الرصيد المتاح:</span>
                    <span style={{ fontWeight: '800', color: currentBalance <= 0 ? '#ef4444' : '#1e293b' }}>
                      {currentBalance} {cat.unit}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>سعر الوحدة:</span>
                    <span style={{ fontWeight: 'bold' }}>{cat.price.toLocaleString()} ج.م</span>
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.badge(currentBalance > 0 ? '#dcfce7' : '#fee2e2', currentBalance > 0 ? '#16a34a' : '#ef4444')}>
                      {currentBalance > 0 ? 'في المخزن' : 'نفذت الكمية'}
                    </span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>إجمالي القيمة</div>
                      <div style={{ fontWeight: '900', color: '#2563eb', fontSize: '1.1rem' }}>{totalPrice.toLocaleString()} ج.م</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={onBack} style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>
        <ArrowRight size={20} /> العودة للوحة التحكم الرئيسية
      </button>
    </div>
  );
};

export default InventoryERP;
