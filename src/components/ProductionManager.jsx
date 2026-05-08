import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, Plus, Trash2 } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onBack, setStock }) => {
  // تأمين البيانات والتأكد من أنها مصفوفة
  const safeStock = useMemo(() => Array.isArray(stock) ? stock : [], [stock]);
  
  // تصحيح الفلترة: إظهار أي شيء في المخزن ما عدا المنتجات النهائية (Finished) 
  // لضمان ظهور المواد حتى لو اختلف مسمى التصنيف
  const availableMaterials = useMemo(() => 
    safeStock.filter(item => item.category !== 'finished'), 
    [safeStock]
  );

  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    selectedIngredients: [] 
  });

  // معايير الإنتاج (تأكد أن الأسماء هنا تطابق أسماء الأصناف في المخزن تماماً)
  const GOLDEN_RECIPE = {
    "دقيق": 0.950, "سكر": 0.100, "عجوة": 0.055, "سمنة": 0.150,
    "زبدة": 0.050, "لبن": 0.280, "كارتون": 1, "تغليف": 0.020,
    "سولار": 0.010, "كهرباء": 0.005
  };

  const addIngredient = (ingredientName) => {
    if (!ingredientName) return;
    
    // التحقق من عدم التكرار
    if (formData.selectedIngredients.find(i => i.name === ingredientName)) {
      alert("هذه المادة موجودة بالفعل في قائمة السحب");
      return;
    }

    setFormData(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, { name: ingredientName, amount: 0 }]
    }));
  };

  const removeIngredient = (name) => {
    setFormData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.filter(i => i.name !== name)
    }));
  };

  const handleAmountChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.map(i => 
        i.name === name ? { ...i, amount: parseFloat(value) || 0 } : i
      )
    }));
  };

  const calculateAndOpenSheet = () => {
    const ings = formData.selectedIngredients;
    if (ings.length === 0) {
      alert("الرجاء اختيار مواد من القائمة المنسدلة أولاً");
      return;
    }

    // حساب كمية الإنتاج بناءً على "أقل مادة متوفرة" بالنسبة للمعيار
    const limits = ings.map(ing => {
      const recipeRatio = GOLDEN_RECIPE[ing.name.trim()];
      if (!recipeRatio || ing.amount <= 0) return Infinity;
      return Math.floor(ing.amount / recipeRatio);
    }).filter(val => val !== Infinity);

    const actualQty = limits.length > 0 ? Math.min(...limits) : 0;

    if (actualQty <= 0) {
      alert("⚠️ الكميات المدخلة لا تكفي لإنتاج كرتونة واحدة بناءً على المعايير.");
      return;
    }

    const details = ings.map(ing => {
      const recipeRatio = GOLDEN_RECIPE[ing.name.trim()] || 0;
      const consumed = actualQty * recipeRatio;
      const surplus = ing.amount - consumed;
      return {
        name: ing.name,
        withdrawn: ing.amount.toFixed(3),
        consumed: consumed.toFixed(3),
        surplus: surplus.toFixed(3)
      };
    });

    setFinalReport({ actualQty, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    if (!finalReport) return;
    
    // إنشاء نسخة جديدة من المخزن لتعديلها
    const updatedStock = JSON.parse(JSON.stringify(safeStock));
    let totalProductionCost = 0;

    // 1. خصم المواد الخام من المخزن
    finalReport.details.forEach(item => {
      const stockItem = updatedStock.find(s => s.name.trim() === item.name.trim());
      if (stockItem) {
        const consumedQty = parseFloat(item.consumed);
        stockItem.balance = (stockItem.balance || 0) - consumedQty;
        totalProductionCost += (consumedQty * (stockItem.price || 0));
      }
    });

    // 2. إضافة المنتج النهائي (المعمول) للمخزن
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

    // تحديث المخزن الرئيسي
    setStock(updatedStock);
    
    // حفظ سجل الإنتاج
    onSaveProduction({
      ...formData,
      productionQty: finalReport.actualQty,
      totalCost: totalProductionCost,
      details: finalReport.details
    });

    alert(`✅ تم الإنتاج بنجاح: ${finalReport.actualQty} كرتونة.`);
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: 'Arial', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Factory size={24} color="#1e5631" /> نظام سحب الخامات والإنتاج
        </h1>
        <button onClick={onBack} style={iconBtnStyle}><ArrowLeft /></button>
      </div>

      {/* منطقة اختيار المواد من المخزن */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>
          إضافة مادة من المخزن الحالي:
        </label>
        <select 
          onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
          style={selectStyle}
        >
          <option value="">-- اختر مادة لإضافتها للقائمة --</option>
          {availableMaterials.length > 0 ? (
            availableMaterials.map(m => (
              <option key={m.id || m.name} value={m.name}>
                {m.name} (المتوفر: {m.balance} {m.unit})
              </option>
            ))
          ) : (
            <option disabled>لا توجد مواد خامة في المخزن!</option>
          )}
        </select>
      </div>

      {/* القائمة الديناميكية للمواد المختارة */}
      <div style={gridStyle}>
        {formData.selectedIngredients.map((ing) => {
          const originalItem = safeStock.find(s => s.name === ing.name);
          return (
            <div key={ing.name} style={ingBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '800', color: '#1e293b' }}>{ing.name}</span>
                <button onClick={() => removeIngredient(ing.name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <input 
                  type="number" 
                  value={ing.amount || ''} 
                  onChange={(e) => handleAmountChange(ing.name, e.target.value)}
                  style={ingInput}
                  placeholder="الكمية المسحوبة"
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>
                   رصيد المخزن: <span style={{ color: '#059669', fontWeight: 'bold' }}>{originalItem?.balance || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {formData.selectedIngredients.length > 0 && (
        <button onClick={calculateAndOpenSheet} style={mainBtnStyle}>
          <RefreshCw size={20} /> معالجة وحساب كمية الإنتاج
        </button>
      )}

      {/* مودال التقرير النهائي */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>📊 تقرير المعايرة</h3>
                <X onClick={() => setShowReport(false)} style={{ cursor: 'pointer' }} />
             </div>
             
             <div style={resultBadge}>
                <div style={{ fontSize: '0.9rem' }}>الإنتاج الفعلي المحقق:</div>
                <div style={{ fontSize: '2rem' }}>{finalReport.actualQty} <small style={{ fontSize: '1rem' }}>كرتونة</small></div>
             </div>

             <div style={{ overflow: 'auto', maxHeight: '250px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      <th style={thStyle}>المادة</th>
                      <th style={thStyle}>مستهلك</th>
                      <th style={thStyle}>فائض</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalReport.details.map(item => (
                      <tr key={item.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}>{item.name}</td>
                        <td style={{ ...tdStyle, color: '#dc2626', fontWeight: 'bold' }}>{item.consumed}</td>
                        <td style={{ ...tdStyle, color: '#059669' }}>{item.surplus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <button onClick={handleFinalSave} style={saveBtnStyle}>
                <Save size={18} /> اعتماد الترحيل للمخازن
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المحدثة لضمان الوضوح
const headerStyle = { background: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '1rem', cursor: 'pointer', background: '#f8fafc' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' };
const ingBox = { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const ingInput = { width: '100%', border: 'none', borderBottom: '2px solid #1e5631', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', color: '#1e5631' };
const mainBtnStyle = { width: '100%', padding: '18px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(30, 86, 49, 0.3)' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '25px', borderRadius: '25px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const resultBadge = { background: '#ecfdf5', padding: '20px', borderRadius: '15px', textAlign: 'center', margin: '15px 0', color: '#065f46', border: '1px solid #10b981' };
const saveBtnStyle = { width: '100%', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', marginTop: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer' };
const thStyle = { padding: '10px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '10px', textAlign: 'right' };
const iconBtnStyle = { border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer' };

export default ProductionManager;
