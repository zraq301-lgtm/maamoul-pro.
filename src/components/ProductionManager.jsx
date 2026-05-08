import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, CheckCircle2, Package } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onSaveWaste, onBack, setStock }) => {
  const safeStock = Array.isArray(stock) ? stock : [];
  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    ingredients: {
      دقيق: 0, سكر: 0, عجوة: 0, سمنة: 0, زبدة: 0,
      سولار: 0, كهرباء: 0, لبن: 0, كارتون: 0, تغليف: 0
    }
  });

  // --- المعيار التقديري لكل كرتونة واحدة (يمكنك تعديل النسب هنا) ---
  const GOLDEN_RECIPE = {
    دقيق: 0.950,
    سكر: 0.100,
    عجوة: 0.055,
    سمنة: 0.150,
    زبدة: 0.050,
    لبن: 0.280,
    كارتون: 1,
    تغليف: 0.020, // وحدة تغليف
    سولار: 0.010,
    كهرباء: 0.005
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

  // دالة الحساب الذكي وفتح الشيت
  const calculateAndOpenSheet = () => {
    const ings = formData.ingredients;
    
    // حساب أقصى إنتاج ممكن بناءً على الخامات المسحوبة (Bottleneck logic)
    const limits = Object.keys(GOLDEN_RECIPE).map(key => {
      if (!ings[key] || ings[key] <= 0) return Infinity;
      return Math.floor(ings[key] / GOLDEN_RECIPE[key]);
    }).filter(val => val !== Infinity);

    const actualQty = limits.length > 0 ? Math.min(...limits) : 0;

    if (actualQty <= 0) {
      alert("⚠️ الكميات المسحوبة لا تكفي لإنتاج وحدة واحدة. تأكد من إدخال المكونات الأساسية.");
      return;
    }

    // تجهيز بيانات الشيت التفصيلي
    const details = Object.keys(formData.ingredients).map(key => {
      const withdrawn = ings[key] || 0;
      const consumed = withdrawn > 0 ? (actualQty * (GOLDEN_RECIPE[key] || 0)) : 0;
      const surplus = withdrawn - consumed;
      return {
        name: key,
        withdrawn: withdrawn.toFixed(3),
        consumed: consumed.toFixed(3),
        surplus: surplus.toFixed(3)
      };
    });

    setFinalReport({ actualQty, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    const updatedStock = JSON.parse(JSON.stringify(safeStock));
    let totalCost = 0;

    // 1. خصم المستهلك فقط من المخزن (الفائض يبقى في المخزن)
    finalReport.details.forEach(item => {
      const stockItem = updatedStock.find(s => s.name?.trim() === item.name.trim());
      if (stockItem) {
        const consumedQty = parseFloat(item.consumed);
        stockItem.balance = (stockItem.balance || 0) - consumedQty;
        totalCost += (consumedQty * (stockItem.price || 0));
      }
    });

    // 2. ترحيل المنتج النهائي لقسم "المنتج النهائي"
    const productName = "معمول جاهز الفاخر";
    const unitCost = totalCost / finalReport.actualQty;
    let productItem = updatedStock.find(s => s.name === productName);

    if (productItem) {
      productItem.balance += finalReport.actualQty;
      productItem.price = unitCost; // تحديث السعر بآخر تكلفة
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

    // 3. الحفظ النهائي
    setStock(updatedStock);
    onSaveProduction({
      ...formData,
      productionQty: finalReport.actualQty,
      totalCost,
      details: finalReport.details
    });

    alert("✅ تم اعتماد شيت الإنتاج، ترحيل المنتج النهائي، ورد الفائض للمخزن.");
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
          قسم الإنتاج والمعايرة <Factory size={20} color="#1e5631" style={{ marginRight: '8px' }} />
        </h1>
        <button onClick={onBack} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px' }}><ArrowLeft size={20} /></button>
      </div>

      {/* Info Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={infoCard}><Calendar size={14} /> <input type="date" value={formData.date} onChange={(e)=>handleChange(e,'info','date')} style={borderlessInput} /></div>
        <div style={infoCard}><Clock size={14} /> <select value={formData.shift} onChange={(e)=>handleChange(e,'info','shift')} style={borderlessInput}>
          <option>الأولى</option><option>الثانية</option><option>السهرة</option></select>
        </div>
      </div>

      {/* Ingredients Grid */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ClipboardList size={18} /> الخامات المسحوبة من العهدة
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                رصيد: {safeStock.find(s => s.name?.trim() === ing.trim())?.balance || 0}
              </span>
            </div>
          ))}
        </div>

        <button 
          onClick={calculateAndOpenSheet}
          style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <RefreshCw size={18} /> احسب الإنتاج وافتح الشيت
        </button>
      </div>

      {/* Modal: شيت التفاصيل */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📊 شيت مطابقة المعيار</h2>
              <X onClick={() => setShowReport(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '15px', textAlign: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534' }}>إجمالي كراتين الإنتاج المستخرجة:</span>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e5631' }}>{finalReport?.actualQty}</div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  <tr style={{ textAlign: 'right' }}>
                    <th style={tdStyle}>الصنف</th>
                    <th style={tdStyle}>المستهلك</th>
                    <th style={tdStyle}>الفائض (يرد)</th>
                  </tr>
                </thead>
                <tbody>
                  {finalReport?.details.filter(d => d.withdrawn > 0).map(item => (
                    <tr key={item.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{item.name}</td>
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
              <Save size={18} /> اعتماد وحفظ في قسم المنتج النهائي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المساعدة
const infoCard = { background: '#fff', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const borderlessInput = { border: 'none', outline: 'none', fontSize: '0.75rem', width: '100%', background: 'transparent' };
const ingBox = { background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column' };
const ingInput = { width: '100%', border: 'none', background: 'transparent', borderBottom: '2px solid #1e5631', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', outline: 'none', margin: '5px 0' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' };
const tdStyle = { padding: '10px 5px' };

export default ProductionManager;
