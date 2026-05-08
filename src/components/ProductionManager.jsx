import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, Calendar, Clock, ClipboardList, RefreshCw, Save, X, Plus, Trash2 } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onBack, setStock }) => {
  const safeStock = useMemo(() => Array.isArray(stock) ? stock : [], [stock]);
  
  // تصفية المخزن لعرض الخامات فقط في قائمة الاختيار
  const availableRawMaterials = useMemo(() => 
    safeStock.filter(item => item.category === 'raw' || item.category === 'ingredients'), 
    [safeStock]
  );

  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  // الحالة الابتدائية
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    // بدلاً من الأجسام الثابتة، نبدأ بمصفوفة فارغة للمواد المختارة
    selectedIngredients: [] 
  });

  // المعايير (يمكنك نقلها لقاعدة بيانات لاحقاً)
  const GOLDEN_RECIPE = {
    "دقيق": 0.950, "سكر": 0.100, "عجوة": 0.055, "سمنة": 0.150,
    "زبدة": 0.050, "لبن": 0.280, "كارتون": 1, "تغليف": 0.020,
    "سولار": 0.010, "كهرباء": 0.005
  };

  // دالة لإضافة مادة من المخزن إلى قائمة السحب
  const addIngredient = (ingredientName) => {
    if (!ingredientName) return;
    if (formData.selectedIngredients.find(i => i.name === ingredientName)) {
      alert("المادة مضافة بالفعل");
      return;
    }
    setFormData(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, { name: ingredientName, amount: 0 }]
    }));
  };

  // دالة حذف مادة من القائمة الحالية
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
      alert("الرجاء إضافة مواد من المخزن أولاً");
      return;
    }

    // حساب الإنتاج بناءً على المواد التي لها "معيار" فقط
    const limits = ings.map(ing => {
      const recipeRatio = GOLDEN_RECIPE[ing.name];
      if (!recipeRatio || ing.amount <= 0) return Infinity;
      return Math.floor(ing.amount / recipeRatio);
    }).filter(val => val !== Infinity);

    const actualQty = limits.length > 0 ? Math.min(...limits) : 0;

    if (actualQty <= 0) {
      alert("⚠️ الكميات لا تكفي لإنتاج كرتونة واحدة (تأكد من مطابقة المعيار)");
      return;
    }

    const details = ings.map(ing => {
      const recipeRatio = GOLDEN_RECIPE[ing.name] || 0;
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
    const updatedStock = [...safeStock];
    let totalProductionCost = 0;

    finalReport.details.forEach(item => {
      const stockIdx = updatedStock.findIndex(s => s.name === item.name);
      if (stockIdx !== -1) {
        const consumedQty = parseFloat(item.consumed);
        updatedStock[stockIdx].balance -= consumedQty;
        totalProductionCost += (consumedQty * (updatedStock[stockIdx].price || 0));
      }
    });

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

    setStock(updatedStock);
    onSaveProduction({ ...formData, productionQty: finalReport.actualQty, totalCost: totalProductionCost });
    alert("✅ تم ترحيل البيانات للمخزن بنجاح");
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: 'Arial', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.1rem', margin: 0 }}>
          الإنتاج المفتوح <Factory size={20} style={{ verticalAlign: 'middle' }} />
        </h1>
        <button onClick={onBack} style={iconBtnStyle}><ArrowLeft /></button>
      </div>

      {/* اختيار المادة من المخزن */}
      <div style={addSectionStyle}>
        <select 
          onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
          style={selectStyle}
        >
          <option value="">➕ إضافة مادة من المخزن...</option>
          {availableRawMaterials.map(m => (
            <option key={m.id} value={m.name}>{m.name} (متوفر: {m.balance})</option>
          ))}
        </select>
      </div>

      {/* قائمة المواد المسحوبة */}
      <div style={gridStyle}>
        {formData.selectedIngredients.map((ing) => (
          <div key={ing.name} style={ingBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>{ing.name}</span>
              <Trash2 size={16} color="red" onClick={() => removeIngredient(ing.name)} />
            </div>
            <input 
              type="number" 
              value={ing.amount || ''} 
              onChange={(e) => handleAmountChange(ing.name, e.target.value)}
              style={ingInput}
              placeholder="الكمية"
            />
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
               رصيد المخزن: {safeStock.find(s => s.name === ing.name)?.balance || 0}
            </span>
          </div>
        ))}
      </div>

      <button onClick={calculateAndOpenSheet} style={mainBtnStyle}>
        <RefreshCw size={18} /> احسب الإنتاج الفعلي
      </button>

      {/* مودال التقرير (نفس كودك السابق مع تعديلات بسيطة) */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
             <h2 style={{ textAlign: 'center' }}>نتائج المعايرة</h2>
             <div style={resultBadge}>
                <small>الإنتاج المتوقع:</small>
                <div>{finalReport.actualQty} كرتونة</div>
             </div>
             <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#eee' }}>
                      <th>المادة</th>
                      <th>مستهلك</th>
                      <th>فائض</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalReport.details.map(item => (
                      <tr key={item.name} style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{item.name}</td>
                        <td style={{ color: 'red' }}>{item.consumed}</td>
                        <td style={{ color: 'green' }}>{item.surplus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <button onClick={handleFinalSave} style={saveBtnStyle}>تأكيد وترحيل للمخزن</button>
             <button onClick={() => setShowReport(false)} style={closeBtnStyle}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المضافة
const headerStyle = { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const addSectionStyle = { marginBottom: '15px' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #1e5631', fontSize: '1rem', outline: 'none' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' };
const ingBox = { background: '#fff', padding: '10px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const ingInput = { width: '100%', border: 'none', borderBottom: '2px solid #1e5631', textAlign: 'center', fontSize: '1.1rem', marginTop: '8px', outline: 'none' };
const mainBtnStyle = { width: '100%', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '20px', borderRadius: '20px', width: '100%', maxWidth: '400px' };
const resultBadge = { background: '#f0fdf4', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '15px', color: '#1e5631', fontWeight: 'bold', fontSize: '1.5rem' };
const saveBtnStyle = { width: '100%', padding: '12px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' };
const closeBtnStyle = { width: '100%', padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', marginTop: '5px' };
const iconBtnStyle = { border: 'none', background: 'none', cursor: 'pointer' };

export default ProductionManager;
