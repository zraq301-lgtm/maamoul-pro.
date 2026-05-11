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

  // المكونات الافتراضية للطبخة
  const GOLDEN_RECIPE = {
    "دقيق": 0.950, "سكر": 0.100, "عجوة": 0.055, "سمنة": 0.150,
    "زبدة": 0.050, "لبن": 0.280, "كارتون": 1, "تغليف": 0.020
  };

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
      Swal.fire('خطأ', 'أدخل عدد الكراتين المنتجة', 'error');
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

    Swal.fire('تم الترحيل', 'تم تحديث المخزن بنجاح', 'success');
    onBack();
  };

  return (
    <div style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f0f4f0', minHeight: '100vh' }}>
      
      {/* الهيدر */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={20} color="#1e5631" /></button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e5631' }}>وحدة الإنتاج والتشغيل</h2>
      </div>

      {/* كارت إدخال الإنتاج */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', borderRight: '8px solid #1e5631' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Factory color="#1e5631" />
          <span style={{ fontWeight: 'bold' }}>إنتاج تشغيلة جديدة</span>
        </div>
        
        <label style={labelStyle}>عدد الكراتين المراد إنتاجها:</label>
        <input 
          type="number" 
          value={productionQty} 
          onChange={e => setProductionQty(e.target.value)} 
          style={bigInputStyle} 
          placeholder="0"
          inputMode="decimal"
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
          <label style={{ fontSize: '0.9rem', color: '#64748b' }}>قطع/كرتونة:</label>
          <input 
            type="number" 
            value={unitsPerCarton} 
            onChange={e => setUnitsPerCarton(e.target.value)} 
            style={smallInputStyle}
          />
        </div>
      </div>

      {/* اختيار الخامات */}
      <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem' }}>المواد الخام المستخدمة:</p>
        <select 
          style={selectStyle}
          onChange={(e) => { addIngredient(e.target.value); e.target.value = ""; }}
        >
          <option value="">+ إضافة مادة من المخزن</option>
          {rawMaterials.map(m => <option key={m.id} value={m.name}>{m.name} (رصيد: {m.balance})</option>)}
        </select>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
          {formData.selectedIngredients.map(ing => (
            <div key={ing.name} style={tagStyle}>
              {ing.name}
              <Trash2 size={14} style={{ cursor: 'pointer' }} onClick={() => setFormData(prev => ({...prev, selectedIngredients: prev.selectedIngredients.filter(i => i.name !== ing.name)}))} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={calculateProduction} style={mainBtnStyle}>
        <RefreshCw size={20} /> حساب التكاليف والترحيل للمخزن
      </button>

      {/* عرض أصناف المخزن على شكل شبكة (Grid) */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <LayoutGrid size={22} color="#1e5631" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e5631' }}>حالة المخزن الحالية (شبكة الأصناف)</h3>
        </div>

        <div style={gridContainerStyle}>
          {stock.map(item => {
            const isReady = item.name.includes("جاهز") || item.name.includes("معمول");
            return (
              <div key={item.id} style={{
                ...productCardStyle,
                borderTop: isReady ? '4px solid #1e5631' : '4px solid #3498db'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Package size={18} color={isReady ? "#1e5631" : "#3498db"} />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{isReady ? 'منتج نهائي' : 'خامة'}</span>
                </div>
                <div style={itemNameStyle}>{item.name}</div>
                <div style={itemBalanceStyle}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>الرصيد:</span>
                  <span style={{ color: parseFloat(item.balance) <= 0 ? '#ef4444' : '#1e293b' }}>
                    {item.balance} {item.unit}
                  </span>
                </div>
                <div style={itemPriceStyle}>{item.price} ج.م</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* المودال الخاص بالتقرير */}
      {showReport && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ textAlign: 'center', color: '#1e5631' }}>ملخص الإنتاج</h3>
            <div style={summaryBox}>
              <p>المنتج: <b>معمول تمر فاخر</b></p>
              <p>الكمية المضافة: <b>{finalReport.totalUnits} قطعة</b></p>
              <hr />
              <p style={{ fontSize: '0.8rem' }}>سيتم خصم الخامات تلقائياً من الأرصدة الحالية.</p>
            </div>
            <button onClick={handleFinalSave} style={confirmBtnStyle}>تأكيد الترحيل النهائي</button>
            <button onClick={() => setShowReport(false)} style={cancelBtnStyle}>إغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المضافة والمحدثة
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '12px',
  paddingBottom: '40px'
};

const productCardStyle = {
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '12px',
  borderRadius: '15px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  transition: 'transform 0.2s'
};

const itemNameStyle = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#1e293b',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const itemBalanceStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  marginTop: '5px'
};

const itemPriceStyle = {
  fontSize: '0.75rem',
  color: '#059669',
  background: '#ecfdf5',
  padding: '2px 8px',
  borderRadius: '5px',
  width: 'fit-content',
  marginTop: '5px'
};

const headerStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' };
const backBtnStyle = { border: 'none', background: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#1e5631', fontSize: '0.9rem' };
const bigInputStyle = { width: '100%', padding: '12px', fontSize: '1.8rem', textAlign: 'center', borderRadius: '15px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: '900', color: '#1e5631' };
const smallInputStyle = { width: '70px', padding: '8px', textAlign: 'center', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' };
const tagStyle = { background: '#1e5631', color: '#fff', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(30,86,49,0.2)' };
const mainBtnStyle = { width: '100%', padding: '16px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(30,86,49,0.3)' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContent = { background: '#fff', padding: '25px', borderRadius: '25px', width: '100%', maxWidth: '380px' };
const summaryBox = { background: '#f0fdf4', padding: '15px', borderRadius: '15px', marginBottom: '20px', color: '#166534', border: '1px solid #dcfce7' };
const confirmBtnStyle = { width: '100%', padding: '14px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle = { width: '100%', padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', marginTop: '10px', cursor: 'pointer' };

export default ProductionManager;
