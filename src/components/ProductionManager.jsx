import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, CheckCircle2 } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onSaveWaste, onBack, setStock }) => {
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

  // --- المعيار العالمي لكل وحدة (كرتونة مثلاً) ---
  const GOLDEN_RECIPE = {
    دقيق: 0.950,  // 950 جرام
    لبن: 0.280,   // 280 مل
    عجوة: 0.055,  // 55 جرام
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

  // دالة الحساب الذكي قبل الترحيل
  const calculateProduction = () => {
    const ings = formData.ingredients;
    
    // حساب أقصى إنتاج ممكن بناءً على "عنق الزجاجة" (أقل صنف متوفر)
    const limits = Object.keys(GOLDEN_RECIPE).map(key => {
      if (!ings[key] || ings[key] === 0) return Infinity;
      return Math.floor(ings[key] / GOLDEN_RECIPE[key]);
    }).filter(val => val !== Infinity);

    const actualQty = limits.length > 0 ? Math.min(...limits) : 0;

    if (actualQty <= 0) {
      alert("الكميات المدخلة غير كافية لإنتاج وحدة واحدة حسب المعيار");
      return;
    }

    // حساب المستهلك والفائض
    const details = Object.keys(GOLDEN_RECIPE).map(key => ({
      name: key,
      withdrawn: ings[key] || 0,
      consumed: (actualQty * GOLDEN_RECIPE[key]).toFixed(3),
      surplus: ((ings[key] || 0) - (actualQty * GOLDEN_RECIPE[key])).toFixed(3),
      unitSpec: GOLDEN_RECIPE[key]
    }));

    setFinalReport({ actualQty, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    const updatedStock = JSON.parse(JSON.stringify(safeStock));
    let totalCost = 0;

    // 1. خصم المستهلك فقط ورد الفائض للمخزن (أو خصم الصافي)
    finalReport.details.forEach(item => {
      const stockItem = updatedStock.find(s => s.name?.trim() === item.name.trim());
      if (stockItem) {
        const qtyToDeduct = parseFloat(item.consumed);
        stockItem.balance = (stockItem.balance || 0) - qtyToDeduct;
        totalCost += (qtyToDeduct * (stockItem.price || 0));
      }
    });

    // 2. إضافة المنتج النهائي للمخزن (قسم المنتج النهائي)
    const productName = "معمول جاهز الفاخر";
    let productItem = updatedStock.find(s => s.name === productName);
    const unitCost = totalCost / finalReport.actualQty;

    if (productItem) {
      productItem.balance += finalReport.actualQty;
      productItem.price = unitCost;
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

    setStock(updatedStock);
    onSaveProduction({
      ...formData,
      productionQty: finalReport.actualQty,
      totalCost,
      details: finalReport.details
    });

    alert("تم اعتماد الإنتاج، خصم المستهلك، ورد الفائض للمخزن بنجاح ✅");
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
          نظام الإنتاج بالمعيار <Factory size={20} color="#1e5631" style={{ marginRight: '8px' }} />
        </h1>
        <button onClick={onBack} style={{ border: 'none', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}><ArrowLeft size={20} /></button>
      </div>

      {/* Info Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={infoCard}><Calendar size={14} /> <input type="date" value={formData.date} onChange={(e)=>handleChange(e,'info','date')} style={borderlessInput} /></div>
        <div style={infoCard}><Clock size={14} /> <select value={formData.shift} onChange={(e)=>handleChange(e,'info','shift')} style={borderlessInput}>
          <option>الأولى</option><option>الثانية</option><option>السهرة</option></select>
        </div>
      </div>

      {/* Inputs Grid */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>الكميات المسحوبة من العهدة:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {Object.keys(formData.ingredients).map(ing => (
            <div key={ing} style={ingBox}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{ing}</span>
              <input 
                type="number" 
                placeholder="0" 
                value={formData.ingredients[ing] || ''} 
                onChange={(e) => handleChange(e, 'ingredients', ing)}
                style={ingInput}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={calculateProduction}
          style={{ width: '100%', marginTop: '25px', padding: '18px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}
        >
          <RefreshCw size={20} /> حساب الوحدات المنتجة (بالمعيار)
        </button>
      </div>

      {/* شيت التفاصيل (Modal) */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>📊 شيت تفاصيل الإنتاج</h2>
              <X onClick={() => setShowReport(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '15px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.9rem', color: '#166534' }}>إجمالي الوحدات المطابقة للمعيار:</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e5631' }}>{finalReport?.actualQty} <span style={{fontSize: '1rem'}}>وحدة</span></div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'right' }}>
                    <th style={thStyle}>الصنف</th>
                    <th style={thStyle}>المسحوب</th>
                    <th style={thStyle}>المستهلك</th>
                    <th style={thStyle}>الفائض (يرد)</th>
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
              style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Save size={18} /> تأييد وحفظ في المخزن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const infoCard = { background: '#fff', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const borderlessInput = { border: 'none', outline: 'none', fontSize: '0.8rem', width: '100%', background: 'transparent' };
const ingBox = { background: '#f8fafc', padding: '12px', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' };
const ingInput = { width: '100%', border: 'none', background: 'transparent', borderBottom: '2px solid #1e5631', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '5px', outline: 'none' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '25px', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const thStyle = { padding: '10px', color: '#64748b' };
const tdStyle = { padding: '12px 10px' };

export default ProductionManager;
