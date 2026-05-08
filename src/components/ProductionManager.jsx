import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, CheckCircle2 } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onSaveWaste, onBack, setStock }) => {
  // تأمين البيانات لضمان عدم حدوث خطأ White Screen
  const safeStock = Array.isArray(stock) ? stock : [];
  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    ingredients: {
      دقيق: 0, لبن: 0, عجوة: 0, سمنة: 0, سكر: 0, كارتون: 0
    }
  });

  // المعيار العالمي لكل وحدة (كرتونة)
  const GOLDEN_RECIPE = {
    دقيق: 0.950,
    لبن: 0.280,
    عجوة: 0.055,
    سمنة: 0.150,
    سكر: 0.100,
    كارتون: 1
  };

  const handleChange = (e, category, field) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    if (category === 'ingredients') {
      setFormData(prev => ({
        ...prev,
        ingredients: { ...prev.ingredients, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const calculateProduction = () => {
    const ings = formData.ingredients;
    
    // خوارزمية البحث عن أقل مادة خام (عنق الزجاجة)
    const limits = Object.keys(GOLDEN_RECIPE).map(key => {
      const available = ings[key] || 0;
      if (available === 0) return 0;
      return Math.floor(available / GOLDEN_RECIPE[key]);
    });

    const actualQty = Math.min(...limits);

    if (actualQty <= 0) {
      alert("⚠️ الكميات المسحوبة غير كافية لإنتاج كرتونة واحدة حسب المعيار.");
      return;
    }

    const details = Object.keys(GOLDEN_RECIPE).map(key => ({
      name: key,
      withdrawn: (ings[key] || 0).toFixed(3),
      consumed: (actualQty * GOLDEN_RECIPE[key]).toFixed(3),
      surplus: ((ings[key] || 0) - (actualQty * GOLDEN_RECIPE[key])).toFixed(3)
    }));

    setFinalReport({ actualQty, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    // إنشاء نسخة جديدة من المخزن للتعديل
    const updatedStock = [...safeStock];
    let totalProductionCost = 0;

    // 1. معالجة خصم المواد الخام
    finalReport.details.forEach(item => {
      const stockIndex = updatedStock.findIndex(s => s.name?.trim() === item.name.trim());
      if (stockIndex !== -1) {
        const consumed = parseFloat(item.consumed);
        // حساب التكلفة بناءً على السعر المسجل في المخزن
        totalProductionCost += consumed * (updatedStock[stockIndex].price || 0);
        // تحديث الرصيد (خصم المستهلك فقط وبقاء الفائض)
        updatedStock[stockIndex].balance = (updatedStock[stockIndex].balance || 0) - consumed;
      }
    });

    // 2. ترحيل المنتج النهائي
    const productName = "معمول جاهز الفاخر";
    const unitCost = totalProductionCost / finalReport.actualQty;
    const productIndex = updatedStock.findIndex(s => s.name === productName);

    if (productIndex !== -1) {
      updatedStock[productIndex].balance += finalReport.actualQty;
      updatedStock[productIndex].price = unitCost;
    } else {
      updatedStock.push({
        id: Date.now(),
        name: productName,
        balance: finalReport.actualQty,
        unit: 'كرتونة',
        price: unitCost,
        category: 'finished'
      });
    }

    // تنفيذ الحفظ الفعلي
    setStock(updatedStock);
    onSaveProduction({
      ...formData,
      productionQty: finalReport.actualQty,
      totalCost: totalProductionCost,
      details: finalReport.details
    });

    alert(`✅ تم الإنتاج بنجاح!\nالكمية: ${finalReport.actualQty} كرتونة\nتم ترحيلها لقسم المنتج النهائي.`);
    onBack(); // العودة للوحة التحكم
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#1e5631', p: '8px', borderRadius: '10px', display: 'flex', padding: '8px' }}>
            <Factory size={24} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>قسم الإنتاج الذكي</h1>
        </div>
        <button onClick={onBack} style={{ border: 'none', background: '#f8fafc', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
          <ArrowLeft size={24} color="#64748b" />
        </button>
      </div>

      {/* Info Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={infoCard}><Calendar size={16} color="#1e5631" /> <input type="date" value={formData.date} onChange={(e)=>handleChange(e,'info','date')} style={borderlessInput} /></div>
        <div style={infoCard}><Clock size={16} color="#1e5631" /> <select value={formData.shift} onChange={(e)=>handleChange(e,'info','shift')} style={borderlessInput}>
          <option>الأولى</option><option>الثانية</option><option>السهرة</option></select>
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <ClipboardList size={18} /> سجل سحب المواد الخام من العهدة
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          {Object.keys(formData.ingredients).map(ing => (
            <div key={ing} style={ingBox}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>{ing}</span>
              <input 
                type="number" 
                placeholder="0.00" 
                value={formData.ingredients[ing] || ''} 
                onChange={(e) => handleChange(e, 'ingredients', ing)}
                style={ingInput}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={calculateProduction}
          style={{ width: '100%', marginTop: '25px', padding: '20px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}
        >
          <RefreshCw size={22} /> معالجة الإنتاج وفتح الشيت
        </button>
      </div>

      {/* Modal: شيت تفاصيل الإنتاج */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>📊 تقرير معيار الإنتاج الفعلي</h2>
              <X onClick={() => setShowReport(false)} style={{ cursor: 'pointer', color: '#ef4444' }} />
            </div>

            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px', border: '1px solid #bcf0da' }}>
              <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 'bold' }}>صافي الإنتاج التام:</span>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#1e5631' }}>
                {finalReport?.actualQty} <span style={{fontSize: '1.2rem'}}>كرتونة</span>
              </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                  <tr style={{ textAlign: 'right' }}>
                    <th style={thStyle}>المادة</th>
                    <th style={thStyle}>المسحوب</th>
                    <th style={thStyle}>المستهلك</th>
                    <th style={thStyle}>الفائض</th>
                  </tr>
                </thead>
                <tbody>
                  {finalReport?.details.map(item => (
                    <tr key={item.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{item.name}</td>
                      <td style={tdStyle}>{item.withdrawn}</td>
                      <td style={{ ...tdStyle, color: '#ef4444', fontWeight: 'bold' }}>{item.consumed}</td>
                      <td style={{ ...tdStyle, color: '#10b981', fontWeight: 'bold' }}>{item.surplus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleFinalSave}
              style={{ width: '100%', marginTop: '20px', padding: '16px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <Save size={20} /> اعتماد الترحيل النهائي للمخزن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS-in-JS Styles
const infoCard = { background: '#fff', padding: '10px 15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const borderlessInput = { border: 'none', outline: 'none', fontSize: '0.9rem', width: '100%', fontWeight: 'bold', color: '#1e293b' };
const ingBox = { background: '#f8fafc', padding: '12px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' };
const ingInput = { width: '100%', border: 'none', background: 'transparent', borderBottom: '2px solid #cbd5e1', textAlign: 'center', fontSize: '1.2rem', fontWeight: '900', marginTop: '8px', outline: 'none', color: '#1e5631' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '15px', backdropFilter: 'blur(4px)' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '30px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const thStyle = { padding: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' };
const tdStyle = { padding: '12px' };

export default ProductionManager;
