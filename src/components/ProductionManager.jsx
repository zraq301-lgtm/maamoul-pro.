import React, { useState } from 'react';
import { Factory, Save, ArrowLeft, AlertTriangle, Box, Info, Calendar, Clock, Plus, Trash2, Layers, Zap } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onSaveWaste, onBack, setStock }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    ingredients: {
      دقيق: 0, سكر: 0, عجوة: 0, سمنة: 0, زبدة: 0, 
      سولار: 0, كهرباء: 0, لبن: 0, كارتون: 0, تغليف: 0
    },
    products: [{ name: 'معمول جاهز', quantity: 0 }],
    wasteQty: 0
  });

  const shifts = ['الأولى', 'الثانية', 'السهرة', 'إضافي'];

  const handleChange = (e, category, field, index = null) => {
    const value = e.target.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value;
    
    if (category === 'ingredients') {
      setFormData(prev => ({ 
        ...prev, 
        ingredients: { ...prev.ingredients, [field]: value } 
      }));
    } else if (category === 'products') {
      const updatedProducts = [...formData.products];
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
      setFormData(prev => ({ ...prev, products: updatedProducts }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addProductField = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 0 }]
    }));
  };

  const removeProductField = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleProcessProduction = () => {
    if (!onSaveProduction || !setStock) {
      console.error("Missing required functions");
      return;
    }

    let totalActualCost = 0;
    // أخذ نسخة عميقة من المخزن للعمل عليها
    const updatedStock = JSON.parse(JSON.stringify(stock || []));

    // --- منطق خصم الخامات (النقص من المخزن) ---
    for (const [ingName, requiredQty] of Object.entries(formData.ingredients)) {
      if (requiredQty <= 0) continue;
      
      const stockItem = updatedStock.find(s => s.name && s.name.trim() === ingName.trim());
      const totalAvailable = stockItem ? (stockItem.balance || 0) : 0;

      if (!stockItem || totalAvailable < requiredQty) {
        alert(`⚠️ عجز في مادة: ${ingName}\nالمطلوب: ${requiredQty}\nالمتوفر: ${totalAvailable}`);
        return;
      }

      let remainingToWithdraw = requiredQty;
      
      // الخصم من الدفعات (Batches) لضمان دقة التكلفة والرصيد
      if (!stockItem.batches || stockItem.batches.length === 0) {
        totalActualCost += (requiredQty * (stockItem.price || 0));
        stockItem.balance = (stockItem.balance || 0) - requiredQty;
      } else {
        while (remainingToWithdraw > 0 && stockItem.batches.length > 0) {
          const currentBatch = stockItem.batches[0];
          if (currentBatch.quantity <= remainingToWithdraw) {
            totalActualCost += (currentBatch.quantity * (currentBatch.price || 0));
            remainingToWithdraw -= currentBatch.quantity;
            stockItem.batches.shift();
          } else {
            totalActualCost += (remainingToWithdraw * (currentBatch.price || 0));
            currentBatch.quantity -= remainingToWithdraw;
            remainingToWithdraw = 0;
          }
        }
        // تحديث الرصيد الإجمالي بناءً على المتبقي في الدفعات
        stockItem.balance = stockItem.batches.reduce((sum, b) => sum + b.quantity, 0);
      }
    }

    const totalProductionUnits = formData.products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
    
    if (totalProductionUnits <= 0) {
      alert("⚠️ يرجى إدخال عدد الكراتين المنتجة أولاً");
      return;
    }

    const costPerCarton = totalActualCost / totalProductionUnits;

    // --- منطق إضافة المنتج النهائي للمخزن ---
    formData.products.forEach(prod => {
      if (prod.quantity <= 0) return;

      let productInStock = updatedStock.find(s => s.name && s.name.trim() === prod.name.trim());
      const newBatch = { 
        purchaseDate: formData.date, 
        quantity: parseFloat(prod.quantity), 
        price: costPerCarton 
      };

      if (productInStock) {
        if (!productInStock.batches) productInStock.batches = [];
        productInStock.batches.push(newBatch);
        productInStock.balance = (productInStock.balance || 0) + parseFloat(prod.quantity);
        productInStock.price = costPerCarton; // تحديث السعر لآخر تكلفة إنتاج
      } else {
        updatedStock.push({
          id: Date.now() + Math.random(),
          name: prod.name,
          balance: parseFloat(prod.quantity),
          unit: 'كرتونة',
          batches: [newBatch],
          price: costPerCarton
        });
      }
    });

    // تحديث المخزن في الأب (هذا السطر هو المسؤول عن النقص الفعلي في الشاشات الأخرى)
    setStock(updatedStock);
    
    // حفظ السجل التاريخي
    onSaveProduction({ 
      ...formData, 
      id: Date.now(),
      totalActualCost: totalActualCost.toFixed(2),
      actualUnitCost: costPerCarton.toFixed(2),
      totalProducedQty: totalProductionUnits
    });

    if (formData.wasteQty > 0 && onSaveWaste) {
      onSaveWaste({
        id: Date.now() + 1,
        date: formData.date,
        item: `هالك إنتاج - وردية ${formData.shift}`,
        quantity: formData.wasteQty,
        costAtLoss: (costPerCarton * formData.wasteQty).toFixed(2),
        reason: "هالك تشغيل"
      });
    }

    alert(`✅ تم الإنتاج بنجاح!\n1. تم خصم الخامات من المخزن\n2. تم إضافة المنتج الجاهز للمخزن\n3. التكلفة الإجمالية: ${totalActualCost.toFixed(2)} ج.م`);
    if (onBack) onBack();
  };

  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '12px', border: '2px solid #e2e8f0',
    fontSize: '18px', fontWeight: 'bold', textAlign: 'center', outline: 'none', color: '#1e293b'
  };

  const cardStyle = {
    backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  };

  return (
    <div className="production-manager" style={{ direction: 'rtl', padding: '20px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Factory size={28} color="#3b82f6" />
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>تشغيل الإنتاج والتكلفة</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b' }}><Calendar size={14} /> تاريخ التشغيل</label>
            <input type="date" value={formData.date} onChange={(e) => handleChange(e, 'info', 'date')} style={{ ...inputStyle, textAlign: 'right' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b' }}><Clock size={14} /> الوردية</label>
            <select value={formData.shift} onChange={(e) => handleChange(e, 'info', 'shift')} style={inputStyle}>
              {shifts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Zap size={20} color="#f59e0b" />
          <h3 style={{ margin: 0, color: '#475569', fontSize: '18px' }}>كميات الخامات المستهلكة</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {Object.keys(formData.ingredients).map(ing => {
            const itemInStock = (stock || []).find(s => s.name && s.name.trim() === ing.trim());
            const balance = itemInStock ? itemInStock.balance : 0;
            return (
              <div key={ing} style={{ background: '#f8fafc', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>{ing}</div>
                <input type="number" value={formData.ingredients[ing] || ''} placeholder="0" onChange={(e) => handleChange(e, 'ingredients', ing)} style={inputStyle} />
                <div style={{ fontSize: '12px', marginTop: '8px', color: balance > 0 ? '#10b981' : '#ef4444' }}>المتوفر: {balance}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...cardStyle, backgroundColor: '#1e293b', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>الإنتاج الفعلي (كرتونة)</h3>
          </div>
          <button onClick={addProductField} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px' }}><Plus size={16} /> إضافة منتج</button>
        </div>

        {formData.products.map((prod, index) => (
          <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '15px', backgroundColor: '#2d3a4f', padding: '15px', borderRadius: '15px' }}>
            <input type="text" value={prod.name} onChange={(e) => handleChange(e, 'products', 'name', index)} style={{ ...inputStyle, background: '#1e293b', color: '#fff' }} />
            <input type="number" value={prod.quantity || ''} onChange={(e) => handleChange(e, 'products', 'quantity', index)} placeholder="0" style={{ ...inputStyle, background: '#1e293b', color: '#fff' }} />
            {index > 0 && <button onClick={() => removeProductField(index)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px' }}><Trash2 size={20} /></button>}
          </div>
        ))}

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
          <label style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}><AlertTriangle size={14} /> هالك الإنتاج:</label>
          <input type="number" value={formData.wasteQty || ''} onChange={(e) => handleChange(e, 'info', 'wasteQty')} style={{ ...inputStyle, backgroundColor: '#fff', marginTop: '10px' }} placeholder="بالكرتونة" />
        </div>

        <button onClick={handleProcessProduction} style={{ width: '100%', padding: '18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', marginTop: '25px', cursor: 'pointer' }}><Save size={20} /> ترحيل البيانات وحساب التكلفة</button>
      </div>

      <button onClick={onBack} style={{ width: '100%', marginTop: '10px', background: 'transparent', border: '2px solid #cbd5e1', padding: '15px', borderRadius: '15px', color: '#64748b' }}><ArrowLeft size={18} /> العودة</button>
    </div>
  );
};

export default ProductionManager;
