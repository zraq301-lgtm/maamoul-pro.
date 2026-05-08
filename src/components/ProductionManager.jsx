import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, CheckCircle2, Package } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onBack, setStock }) => {
  // تأمين البيانات القادمة من الخارج
  const safeStock = useMemo(() => Array.isArray(stock) ? stock : [], [stock]);
  
  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  // الحالة الابتدائية للمدخلات
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    ingredients: {
      دقيق: 0, سكر: 0, عجوة: 0, سمنة: 0, زبدة: 0,
      سولار: 0, كهرباء: 0, لبن: 0, كارتون: 0, تغليف: 0
    }
  });

  // المعيار التقديري
  const GOLDEN_RECIPE = {
    دقيق: 0.950, سكر: 0.100, عجوة: 0.055, سمنة: 0.150,
    زبدة: 0.050, لبن: 0.280, كارتون: 1, تغليف: 0.020,
    سولار: 0.010, كهرباء: 0.005
  };

  // دالة تغيير المدخلات (تم إصلاحها لتعمل مع الـ Inputs بشكل صحيح)
  const handleInputChange = (e, category, field) => {
    const val = e.target.value;
    // تحويل القيمة لرقم فقط إذا كان الحقل يخص المكونات
    const finalValue = category === 'ingredients' ? (parseFloat(val) || 0) : val;

    if (category === 'ingredients') {
      setFormData(prev => ({
        ...prev,
        ingredients: { ...prev.ingredients, [field]: finalValue }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: finalValue }));
    }
  };

  const calculateAndOpenSheet = () => {
    const ings = formData.ingredients;
    
    // حساب عنق الزجاجة (أقل كمية تسمح بها الخامات)
    const limits = Object.keys(GOLDEN_RECIPE).map(key => {
      const available = ings[key] || 0;
      if (available <= 0) return Infinity;
      return Math.floor(available / GOLDEN_RECIPE[key]);
    }).filter(val => val !== Infinity);

    const actualQty = limits.length > 0 ? Math.min(...limits) : 0;

    if (actualQty <= 0) {
      alert("⚠️ الكميات المسحوبة لا تكفي لإنتاج كرتونة واحدة على الأقل.");
      return;
    }

    const details = Object.keys(ings).map(key => {
      const withdrawn = ings[key] || 0;
      const consumed = actualQty * (GOLDEN_RECIPE[key] || 0);
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
    if (!finalReport) return;

    const updatedStock = [...safeStock];
    let totalProductionCost = 0;

    // 1. الخصم من المخزن
    finalReport.details.forEach(item => {
      const stockIdx = updatedStock.findIndex(s => s.name?.trim() === item.name.trim());
      if (stockIdx !== -1) {
        const consumedQty = parseFloat(item.consumed);
        updatedStock[stockIdx].balance = (updatedStock[stockIdx].balance || 0) - consumedQty;
        totalProductionCost += (consumedQty * (updatedStock[stockIdx].price || 0));
      }
    });

    // 2. إضافة المنتج النهائي
    const productName = "معمول جاهز الفاخر";
    const unitCost = totalProductionCost / finalReport.actualQty;
    const productIdx = updatedStock.findIndex(s => s.name === productName);

    if (productIdx !== -1) {
      updatedStock[productIdx].balance += finalReport.actualQty;
      updatedStock[productIdx].price = unitCost;
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

    // 3. التنفيذ
    setStock(updatedStock);
    onSaveProduction({
      ...formData,
      productionQty: finalReport.actualQty,
      totalCost: totalProductionCost,
      details: finalReport.details
    });

    alert("✅ تم الحفظ بنجاح وترحيل البيانات للمخزن.");
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
          قسم الإنتاج والمعايرة <Factory size={20} color="#1e5631" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        </h1>
        <button onClick={onBack} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Info Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={infoCard}>
          <Calendar size={14} /> 
          <input type="date" value={formData.date} onChange={(e) => handleInputChange(e, 'info', 'date')} style={borderlessInput} />
        </div>
        <div style={infoCard}>
          <Clock size={14} /> 
          <select value={formData.shift} onChange={(e) => handleInputChange(e, 'info', 'shift')} style={borderlessInput}>
            <option value="الأولى">الأولى</option>
            <option value="الثانية">الثانية</option>
            <option value="السهرة">السهرة</option>
          </select>
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
                onChange={(e) => handleInputChange(e, 'ingredients', ing)}
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
          style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
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
              <span style={{ fontSize: '0.85rem', color: '#166534' }}>إجمالي كراتين الإنتاج:</span>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e5631' }}>{finalReport?.actualQty}</div>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '250px', border: '1px solid #eee', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={tdStyle}>الصنف</th>
                    <th style={tdStyle}>المستهلك</th>
                    <th style={tdStyle}>الفائض</th>
                  </tr>
                </thead>
                <tbody>
                  {finalReport?.details.map(item => (
                    <tr key={item.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{item.name}</td>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{item.consumed}</td>
                      <td style={{ ...tdStyle, color: '#10b981' }}>{item.surplus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleFinalSave}
              style={{ width: '100%', marginTop: '20px', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <Save size={18} /> اعتماد وترحيل للمخزن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات
const infoCard = { background: '#fff', padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const borderlessInput = { border: 'none', outline: 'none', fontSize: '0.75rem', width: '100%', background: 'transparent', cursor: 'pointer' };
const ingBox = { background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column' };
const ingInput = { width: '100%', border: 'none', background: 'transparent', borderBottom: '2px solid #1e5631', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', outline: 'none', margin: '5px 0' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px' };
const tdStyle = { padding: '8px', textAlign: 'center' };

export default ProductionManager;
