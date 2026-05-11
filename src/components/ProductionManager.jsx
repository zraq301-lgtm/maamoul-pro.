import React, { useState, useMemo } from 'react';
import { Factory, ArrowLeft, RefreshCw, Save, Trash2, Package, Database } from 'lucide-react';
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

  // تصفية المواد الخام فقط
  const rawMaterials = useMemo(() => 
    stock?.filter(item => item?.name && !item.name.includes("معمول") && !item.name.includes("جاهز")) || [],
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
      Swal.fire('تنبيه', 'يرجى إدخال عدد الكراتين بشكل صحيح', 'warning');
      return;
    }

    if (formData.selectedIngredients.length === 0) {
      Swal.fire('خطأ', 'يجب اختيار مادة خام واحدة على الأقل', 'error');
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
      updatedStock[productIndex].balance = (parseFloat(updatedStock[productIndex].balance || 0) + finalReport.totalUnits).toFixed(0);
      updatedStock[productIndex].price = unitPrice;
    } else {
      updatedStock.push({
        id: `prod-${Date.now()}`,
        name: PRODUCT_NAME,
        date: formData.date,
        unit: 'وحدة',
        balance: finalReport.totalUnits.toString(),
        price: unitPrice,
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

    Swal.fire('نجاح', 'تم الترحيل وتحديث المخزن بنجاح', 'success');
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '20px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={20} /></button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e5631' }}>إدارة خط الإنتاج</h2>
      </div>

      <div style={mainGrid}>
        {/* Left Column: Production Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={cardStyle}>
            <h3 style={cardTitle}><Factory size={18} /> تفاصيل الطبخة الحالية</h3>
            <label style={labelStyle}>عدد الكراتين المنتجة:</label>
            <input 
              type="number" 
              value={productionQty} 
              onChange={e => setProductionQty(e.target.value)} 
              style={bigInputStyle} 
              placeholder="0"
            />
            
            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>قطع / كرتونة:</span>
              <input 
                type="number" 
                value={unitsPerCarton} 
                onChange={e => setUnitsPerCarton(e.target.value)} 
                style={smallInputStyle}
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>إضافة مواد خام:</label>
              <select 
                style={selectStyle}
                onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
              >
                <option value="">+ اختر مادة من المخزن</option>
                {rawMaterials.map(m => (
                  <option key={m.id} value={m.name} disabled={parseFloat(m.balance) <= 0}>
                    {m.name} (المتاح: {m.balance})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
              {formData.selectedIngredients.map(ing => (
                <div key={ing.name} style={tagStyle}>
                  {ing.name}
                  <Trash2 size={14} style={{ cursor: 'pointer' }} onClick={() => setFormData(prev => ({...prev, selectedIngredients: prev.selectedIngredients.filter(i => i.name !== ing.name)}))} />
                </div>
              ))}
            </div>

            <button onClick={calculateProduction} style={mainBtnStyle}>
              <RefreshCw size={20} /> معالجة وترحيل الإنتاج
            </button>
          </div>
        </div>

        {/* Right Column: Inventory Grid Display */}
        <div style={cardStyle}>
          <h3 style={cardTitle}><Database size={18} /> حالة المخزن الحالية (الشبكة)</h3>
          <div style={inventoryGrid}>
            {stock.length > 0 ? stock.map(item => (
              <div key={item.id} style={gridItemStyle(item.name)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <Package size={16} color={item.name.includes('جاهز') ? '#1e5631' : '#64748b'} />
                  <span style={badgeStyle(item.name)}>{item.name.includes('جاهز') ? 'منتج نهائي' : 'خام'}</span>
                </div>
                <div style={itemNameStyle}>{item.name}</div>
                <div style={itemQtyStyle}>{item.balance} <small>{item.unit || 'وحدة'}</small></div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', gridColumn: '1/-1', color: '#94a3b8' }}>المخزن فارغ حالياً</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Report */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ textAlign: 'center', color: '#1e5631' }}>تأكيد حركة المخزن</h3>
            <div style={summaryBox}>
              <p>سيتم إنتاج: <b>{finalReport?.totalUnits} وحدة</b></p>
              <p style={{ fontSize: '0.8rem', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                سيتم خصم المكونات تلقائياً من المواد الخام المختارة.
              </p>
            </div>
            <button onClick={handleFinalSave} style={confirmBtnStyle}>تأكيد الحفظ النهائي</button>
            <button onClick={() => setShowReport(false)} style={cancelBtnStyle}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---

const mainGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '20px',
  marginTop: '10px'
};

const inventoryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '12px',
  maxHeight: '500px',
  overflowY: 'auto',
  padding: '5px'
};

const gridItemStyle = (name) => ({
  background: name.includes('جاهز') ? '#f0fdf4' : '#fff',
  border: `1px solid ${name.includes('جاهز') ? '#bbf7d0' : '#e2e8f0'}`,
  borderRadius: '12px',
  padding: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  transition: 'transform 0.2s',
  cursor: 'default'
});

const itemNameStyle = { fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const itemQtyStyle = { fontSize: '1.1rem', fontWeight: '800', color: '#1e5631' };
const badgeStyle = (name) => ({ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: name.includes('جاهز') ? '#1e5631' : '#f1f5f9', color: name.includes('جاهز') ? '#fff' : '#64748b' });

const headerStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' };
const backBtnStyle = { border: 'none', background: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
const cardTitle = { fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e5631', fontSize: '0.9rem' };
const bigInputStyle = { width: '100%', padding: '12px', fontSize: '1.8rem', textAlign: 'center', borderRadius: '12px', border: '2px solid #cbd5e1', background: '#f8fafc', fontWeight: '900', color: '#1e5631', outline: 'none' };
const smallInputStyle = { width: '80px', padding: '8px', textAlign: 'center', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' };
const tagStyle = { background: '#1e5631', color: '#fff', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(30, 86, 49, 0.2)' };
const mainBtnStyle = { width: '100%', padding: '16px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', transition: '0.3s' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContent = { background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const summaryBox = { background: '#f0fdf4', padding: '20px', borderRadius: '15px', marginBottom: '20px', color: '#166534', textAlign: 'center' };
const confirmBtnStyle = { width: '100%', padding: '14px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
const cancelBtnStyle = { width: '100%', padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', marginTop: '10px', cursor: 'pointer' };

export default ProductionManager;
