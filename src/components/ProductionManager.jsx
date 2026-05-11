import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, RefreshCw, Save, Trash2, Package, Database, LayoutGrid } from 'lucide-react';
import Swal from 'sweetalert2';

const ProductionManager = ({ stock = [], onSaveProduction, onBack, setStock }) => {
  const [productionQty, setProductionQty] = useState('');
  const [unitsPerCarton, setUnitsPerCarton] = useState('12');
  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    selectedIngredients: []
  });

  // المكونات الافتراضية للطبخة (النسبة لكل كرتونة)
  const GOLDEN_RECIPE = {
    "دقيق": 0.950, "سكر": 0.100, "عجوة": 0.055, "سمنة": 0.150,
    "زبدة": 0.050, "لبن": 0.280, "كارتون": 1, "تغليف": 0.020
  };

  // تصفية المواد الخام
  const rawMaterials = useMemo(() => 
    stock.filter(item => item.name && !item.name.includes("معمول") && !item.name.includes("جاهز")),
    [stock]
  );

  const addIngredient = (name) => {
    if (!name || formData.selectedIngredients.find(i => i.name === name)) return;
    setFormData(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, { name }]
    }));
  };

  const calculateProduction = () => {
    const cartons = parseFloat(productionQty);
    if (!cartons || cartons <= 0) {
      Swal.fire('تنبيه', 'يرجى إدخال عدد الكراتين المنتجة أولاً', 'warning');
      return;
    }
    if (formData.selectedIngredients.length === 0) {
      Swal.fire('تنبيه', 'يرجى اختيار المواد الخام المستخدمة', 'warning');
      return;
    }

    const totalUnits = cartons * (parseFloat(unitsPerCarton) || 12);
    const details = formData.selectedIngredients.map(ing => {
      const ratio = GOLDEN_RECIPE[ing.name.trim()] || 0;
      return { name: ing.name, consumed: (cartons * ratio).toFixed(3) };
    });

    setFinalReport({ cartons, totalUnits, details });
    setShowReport(true);
  };

  const handleFinalSave = () => {
    const PRODUCT_NAME = "معمول تمر فاخر (جاهز)";
    let totalCost = 0;
    
    const updatedStock = stock.map(item => {
      const reportItem = finalReport.details.find(d => d.name === item.name);
      if (reportItem) {
        const consumed = parseFloat(reportItem.consumed);
        totalCost += (consumed * (parseFloat(item.price) || 0));
        return { ...item, balance: (parseFloat(item.balance || 0) - consumed).toFixed(3) };
      }
      return item;
    });

    const unitPrice = (totalCost / finalReport.totalUnits).toFixed(2);
    const productIndex = updatedStock.findIndex(item => item.name === PRODUCT_NAME);

    if (productIndex !== -1) {
      updatedStock[productIndex].balance = (parseFloat(updatedStock[productIndex].balance || 0) + finalReport.totalUnits).toString();
      updatedStock[productIndex].price = unitPrice;
    } else {
      updatedStock.push({
        id: `prod-${Date.now()}`,
        name: PRODUCT_NAME,
        date: formData.date,
        unit: 'وحدة',
        balance: finalReport.totalUnits.toString(),
        price: unitPrice,
        total: totalCost,
        isNew: false
      });
    }

    setStock(updatedStock);
    onSaveProduction({
      ...formData,
      productionName: PRODUCT_NAME,
      producedQty: finalReport.totalUnits,
      details: finalReport.details
    });

    Swal.fire('تم بنجاح', 'تم تحديث الأرصدة وإضافة المنتج النهائي', 'success');
    onBack();
  };

  // --- كائنات الستايل الداخلية لضمان عدم حدوث خطأ الصفحة البيضاء ---
  const styles = {
    container: { direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { border: 'none', background: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    card: { background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px' },
    bigInput: { width: '100%', padding: '15px', fontSize: '2rem', textAlign: 'center', borderRadius: '15px', border: '2px solid #e2e8f0', color: '#1e5631', fontWeight: 'bold', outline: 'none' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' },
    select: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', backgroundColor: '#fff' },
    tag: { background: '#1e5631', color: '#fff', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' },
    mainBtn: { width: '100%', padding: '16px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '15px' },
    productCard: { background: '#fff', padding: '12px', borderRadius: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderTop: '4px solid #1e5631' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', padding: '25px', borderRadius: '25px', width: '90%', maxWidth: '400px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={22} /></button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>وحدة الإنتاج</h2>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>كم عدد الكراتين (المعجونة)؟</label>
        <input 
          type="number" 
          value={productionQty} 
          onChange={e => setProductionQty(e.target.value)} 
          style={styles.bigInput} 
          placeholder="0"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', alignItems: 'center' }}>
          <span style={styles.label}>قطع لكل كرتونة:</span>
          <input 
            type="number" 
            value={unitsPerCarton} 
            onChange={e => setUnitsPerCarton(e.target.value)} 
            style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}
          />
        </div>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>المواد الخام المستخدمة:</label>
        <select 
          style={styles.select}
          onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
        >
          <option value="">+ اضغط لاختيار مادة</option>
          {rawMaterials.map(m => <option key={m.id} value={m.name}>{m.name} (المتاح: {m.balance})</option>)}
        </select>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
          {formData.selectedIngredients.map(ing => (
            <div key={ing.name} style={styles.tag}>
              {ing.name}
              <Trash2 size={16} onClick={() => setFormData(prev => ({...prev, selectedIngredients: prev.selectedIngredients.filter(i => i.name !== ing.name)}))} style={{ cursor: 'pointer' }} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={calculateProduction} style={styles.mainBtn}>
        <RefreshCw size={20} /> ترحيل الإنتاج للمخزن
      </button>

      {/* عرض الشبكة (Grid) أسفل الصفحة */}
      <h3 style={{ marginTop: '25px', fontSize: '1rem', color: '#475569' }}>
        <LayoutGrid size={18} style={{ verticalAlign: 'middle', marginLeft: '8px' }} />
        حالة المخزن الآن
      </h3>
      <div style={styles.grid}>
        {stock.map(item => (
          <div key={item.id} style={{ ...styles.productCard, borderTopColor: item.name.includes("جاهز") ? "#1e5631" : "#3498db" }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</div>
            <div style={{ fontSize: '0.9rem', color: '#1e5631', fontWeight: '900' }}>{item.balance} <small style={{ fontWeight: 'normal', color: '#64748b' }}>{item.unit}</small></div>
          </div>
        ))}
      </div>

      {/* مودال التأكيد */}
      {showReport && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>تأكيد عملية الإنتاج</h3>
            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
              <p style={{ margin: '5px 0' }}>سيتم إضافة: <b>{finalReport.totalUnits} قطعة معمول</b></p>
              <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#166534' }}>سيتم خصم الخامات المحددة تلقائياً.</p>
            </div>
            <button onClick={handleFinalSave} style={{ ...styles.mainBtn, marginTop: 0 }}>تأكيد وحفظ</button>
            <button onClick={() => setShowReport(false)} style={{ ...styles.mainBtn, background: '#f1f5f9', color: '#64748b', marginTop: '10px' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionManager;
