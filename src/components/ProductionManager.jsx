import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, RefreshCw, Save, X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ProductionManager = ({ stock = [], onSaveProduction, onBack, setStock }) => {
  const safeStock = useMemo(() => Array.isArray(stock) ? stock : [], [stock]);

  const availableMaterials = useMemo(() =>
    safeStock.filter(item => item.category !== 'finished'),
    [safeStock]
  );

  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [productionQty, setProductionQty] = useState('');
  const [unitsPerCarton, setUnitsPerCarton] = useState('12');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    selectedIngredients: []
  });

  const GOLDEN_RECIPE = {
    "دقيق": 0.950, "سكر": 0.100, "عجوة": 0.055, "سمنة": 0.150,
    "زبدة": 0.050, "لبن": 0.280, "كارتون": 1, "تغليف": 0.020,
    "سولار": 0.010, "كهرباء": 0.005
  };

  const addIngredient = (ingredientName) => {
    if (!ingredientName) return;
    if (formData.selectedIngredients.find(i => i.name === ingredientName)) return;

    setFormData(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, { name: ingredientName }]
    }));
  };

  const removeIngredient = (name) => {
    setFormData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.filter(i => i.name !== name)
    }));
  };

  const calculateProduction = () => {
    const cartons = parseFloat(productionQty);
    const units = parseFloat(unitsPerCarton) || 12;
    if (!cartons || cartons <= 0) {
      Swal.fire({ title: 'خطأ', text: 'الرجاء إدخال عدد الكراتين المنتجة أولاً', icon: 'error', timer: 2000, showConfirmButton: false });
      return;
    }

    const totalUnits = cartons * units;
    const details = formData.selectedIngredients.map(ing => {
      const ratio = GOLDEN_RECIPE[ing.name.trim()] || 0;
      const consumed = cartons * ratio;
      return {
        name: ing.name,
        consumed: consumed.toFixed(3),
      };
    });

    setFinalReport({ cartons, unitsPerCarton: units, totalUnits, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    // تفعيل عملية الترحيل الفعلي للمخزن
    const updatedStock = JSON.parse(JSON.stringify(safeStock));
    let totalProductionCost = 0;

    // 1. خصم المواد الخام المستهلكة
    finalReport.details.forEach(item => {
      const stockItem = updatedStock.find(s => s.name.trim() === item.name.trim());
      if (stockItem) {
        const consumedQty = parseFloat(item.consumed);
        stockItem.balance = (stockItem.balance || 0) - consumedQty;
        totalProductionCost += (consumedQty * (stockItem.price || 0));
      }
    });

    // 2. نقل الإنتاج النهائي إلى المخزن
    const productName = "معمول جاهز الفاخر";
    const unitCost = totalProductionCost / finalReport.totalUnits;
    const productIdx = updatedStock.findIndex(s => s.name === productName);

    if (productIdx !== -1) {
      // تحديث رصيد وتكلفة المنتج الموجود
      updatedStock[productIdx].balance = (parseFloat(updatedStock[productIdx].balance) || 0) + finalReport.totalUnits;
      updatedStock[productIdx].price = unitCost;
    } else {
      // إضافة صنف جديد للمنتج النهائي
      updatedStock.push({
        id: Date.now(),
        name: productName,
        balance: finalReport.totalUnits,
        unit: 'وحدة',
        price: unitCost,
        category: 'finished'
      });
    }

    // حفظ التغييرات في المخزن الرئيسي
    setStock(updatedStock);

    // تسجيل العملية في سجل الإنتاج
    onSaveProduction({
      ...formData,
      cartons: finalReport.cartons,
      unitsPerCarton: finalReport.unitsPerCarton,
      totalUnits: finalReport.totalUnits,
      totalCost: totalProductionCost,
      details: finalReport.details
    });

    Swal.fire({
      title: 'تم تسجيل الإنتاج',
      html: `تم إنتاج <b>${finalReport.cartons}</b> كرتونة × <b>${finalReport.unitsPerCarton}</b> وحدة = <b>${finalReport.totalUnits}</b> وحدة<br>وتم خصم المواد الخام وإضافة المنتج للمخزن`,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false
    });
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: 'Arial', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Factory size={24} color="#1e5631" /> تسجيل الإنتاج الفعلي
        </h1>
        <button onClick={onBack} style={iconBtnStyle}><ArrowLeft /></button>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '2px solid #1e5631' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
          كم كرتونة تم إنتاجها اليوم؟
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={productionQty}
          onChange={(e) => setProductionQty(e.target.value)}
          style={ingInputCustom}
          placeholder="إضغط هنا للكتابة..."
        />
        <label style={{ display: 'block', marginTop: '15px', marginBottom: '10px', fontWeight: 'bold', fontSize: '1rem', color: '#475569' }}>
          عدد الوحدات في الكرتونة الواحدة
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={unitsPerCarton}
          onChange={(e) => setUnitsPerCarton(e.target.value)}
          style={{ ...ingInputCustom, fontSize: '1.4rem' }}
          placeholder="12"
        />
        {productionQty && unitsPerCarton && (
          <div style={{ marginTop: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e5631' }}>
            إجمالي الوحدات = {parseFloat(productionQty) * (parseFloat(unitsPerCarton) || 12)} وحدة
          </div>
        )}
      </div>

      <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', color: '#64748b' }}>إضافة المواد المستخدمة في هذه الطبخة:</label>
        <select 
          onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
          style={selectStyle}
        >
          <option value="">-- اختر المواد --</option>
          {availableMaterials.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {formData.selectedIngredients.map((ing) => (
          <div key={ing.name} style={{ background: '#e2e8f0', padding: '8px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{ing.name}</span>
            <Trash2 size={14} color="red" cursor="pointer" onClick={() => removeIngredient(ing.name)} />
          </div>
        ))}
      </div>

      <button onClick={calculateProduction} style={mainBtnStyle}>
        <RefreshCw size={20} /> حساب الاستهلاك والترحيل
      </button>

      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
             <h3>تأكيد ترحيل الإنتاج</h3>
             <div style={resultBadge}>
                <p>سيتم إضافة <b>{finalReport.totalUnits}</b> وحدة للمخزن</p>
                <small>({finalReport.cartons} كرتونة × {finalReport.unitsPerCarton} وحدة)</small>
                <br /><small>وسيتم خصم المكونات التالية بناءً على المعيار</small>
             </div>

             <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th>المادة</th>
                      <th>الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalReport.details.map(item => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td style={{ color: 'red' }}>{item.consumed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <button onClick={handleFinalSave} style={saveBtnStyle}>
                <Save size={18} /> تأكيد الخصم والإضافة
             </button>
             <button onClick={() => setShowReport(false)} style={{ ...saveBtnStyle, background: '#ccc', marginTop: '10px' }}>
                إلغاء
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات
const headerStyle = { background: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' };
const ingInputCustom = { 
    width: '100%', 
    padding: '15px', 
    fontSize: '1.8rem', 
    textAlign: 'center', 
    border: '2px solid #e2e8f0', 
    borderRadius: '10px', 
    color: '#1e5631', 
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9' 
};
const mainBtnStyle = { width: '100%', padding: '18px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '12px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '25px', borderRadius: '25px', width: '100%', maxWidth: '400px' };
const resultBadge = { background: '#f0fdf4', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center' };
const saveBtnStyle = { width: '100%', padding: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' };
const iconBtnStyle = { border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px' };

export default ProductionManager;
