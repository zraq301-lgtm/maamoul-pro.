import React, { useState } from 'react';
import { Factory, ArrowLeft, Calendar, Clock } from 'lucide-react';

const ProductionManager = ({ stock = [], onSaveProduction, onSaveWaste, onBack, setStock }) => {
  // التأكد من أن stock هي دائماً مصفوفة لتجنب انهيار الصفحة البيضاء
  const safeStock = Array.isArray(stock) ? stock : [];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'الأولى',
    ingredients: {
      دقيق: 0, سكر: 0, عجوة: 0, سمنة: 0, زبدة: 0,
      سولار: 0, كهرباء: 0, لبن: 0, كارتون: 0, تغليف: 0
    },
    productionQty: 0,
    wasteQty: 0
  });

  const shifts = ['الأولى', 'الثانية', 'السهرة', 'إضافي'];

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

  const handleProcessProduction = () => {
    if (formData.productionQty <= 0) {
      alert("يرجى إدخال كمية الإنتاج التام أولاً");
      return;
    }

    let totalActualCost = 0;
    // نسخة عميقة من المخزن للعمل عليها
    const updatedStock = JSON.parse(JSON.stringify(safeStock));

    // 1. خصم المواد الخام
    for (const [ingName, requiredQty] of Object.entries(formData.ingredients)) {
      if (requiredQty <= 0) continue;

      const stockItem = updatedStock.find(s => s.name?.trim() === ingName.trim());
      const totalAvailable = stockItem ? (stockItem.balance || 0) : 0;

      if (!stockItem || totalAvailable < requiredQty) {
        alert(`عجز في مادة: ${ingName}\nالمطلوب: ${requiredQty}\nالمتوفر: ${totalAvailable}`);
        return;
      }

      let remainingToWithdraw = requiredQty;
      
      // إذا لم يوجد نظام تشغيلات (Batches)، اخصم من الرصيد مباشرة
      if (!stockItem.batches || stockItem.batches.length === 0) {
        totalActualCost += (requiredQty * (stockItem.price || 0));
        stockItem.balance = (stockItem.balance || 0) - requiredQty;
      } else {
        // الخصم من التشغيلات (FIFO)
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
        stockItem.balance = stockItem.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      }
    }

    // 2. حساب تكلفة الوحدة المنتجة
    const actualUnitCost = formData.productionQty > 0 ? (totalActualCost / formData.productionQty) : 0;
    const finalProductName = "معمول جاهز";
    
    let productItem = updatedStock.find(s => s.name?.trim() === finalProductName);
    const newProductBatch = { 
      id: Date.now(),
      purchaseDate: formData.date, 
      quantity: formData.productionQty, 
      price: actualUnitCost 
    };

    if (productItem) {
      if (!productItem.batches) productItem.batches = [];
      productItem.batches.push(newProductBatch);
      productItem.balance = (productItem.balance || 0) + formData.productionQty;
      productItem.price = actualUnitCost; // تحديث السعر لآخر تكلفة إنتاج
    } else {
      updatedStock.push({
        id: Date.now() + 1,
        name: finalProductName,
        balance: formData.productionQty,
        unit: 'كرتونة',
        batches: [newProductBatch],
        price: actualUnitCost
      });
    }

    // 3. تحديث المخزن وحفظ السجلات
    setStock(updatedStock);
    
    onSaveProduction({
      ...formData,
      id: Date.now(),
      totalActualCost: totalActualCost.toFixed(2),
      actualUnitCost: actualUnitCost.toFixed(2)
    });

    if (formData.wasteQty > 0) {
      onSaveWaste({
        id: Date.now() + 2,
        date: formData.date,
        itemName: `هالك إنتاج - ${formData.shift}`,
        quantity: formData.wasteQty,
        costAtLoss: (actualUnitCost * formData.wasteQty).toFixed(2),
        reason: "هالك تشغيل"
      });
    }

    alert(`تم الترحيل بنجاح!\nالتكلفة الإجمالية: ${totalActualCost.toFixed(2)} ج.م`);
    onBack();
  };

  return (
    <div className="production-container" style={{ direction: 'rtl', padding: '15px', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="glass-card" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '800' }}>
            سجل الإنتاج <Factory size={20} color="#f59e0b" style={{ display: 'inline', marginRight: '5px' }} />
          </h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div className="input-icon-group" style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="#64748b" />
            <input type="date" value={formData.date} onChange={(e) => handleChange(e, 'info', 'date')} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
          </div>
          <div className="input-icon-group" style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '4px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} color="#64748b" />
            <select value={formData.shift} onChange={(e) => handleChange(e, 'info', 'shift')} style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }}>
              {shifts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1rem' }}>خامات التشغيل</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.keys(formData.ingredients).map(ing => {
              const inStock = safeStock.find(s => s.name?.trim() === ing.trim())?.balance || 0;
              return (
                <div key={ing} className="ingredient-item" style={{ padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>{ing}</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={formData.ingredients[ing] || ''}
                    onChange={(e) => handleChange(e, 'ingredients', ing)} 
                    style={{ width: '100%', border: 'none', background: 'transparent', borderBottom: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', outline: 'none', padding: '5px 0' }} 
                  />
                  <span style={{ fontSize: '0.65rem', color: inStock > 0 ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                    المخزن: {inStock}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="production-summary" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '20px', padding: '15px', color: '#fff' }}>
          <h3 style={{ color: '#f59e0b', marginTop: 0, fontSize: '1rem' }}>المنتج النهائي</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>كمية الإنتاج (كرتونة):</label>
            <input 
              type="number" 
              value={formData.productionQty || ''}
              onChange={(e) => handleChange(e, 'info', 'productionQty')} 
              style={{ width: '100%', padding: '10px', borderRadius: '10px', marginTop: '5px', border: 'none', fontSize: '1rem', fontWeight: 'bold' }} 
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.8 }}>الهالك (إن وجد):</label>
            <input 
              type="number" 
              value={formData.wasteQty || ''}
              onChange={(e) => handleChange(e, 'info', 'wasteQty')} 
              style={{ width: '100%', padding: '10px', borderRadius: '10px', marginTop: '5px', border: 'none', color: '#ef4444' }} 
            />
          </div>
          <button 
            onClick={handleProcessProduction} 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ترحيل للعهدة والمخزن
          </button>
        </div>

        <button onClick={onBack} className="btn-back" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> العودة للرئيسية
        </button>
      </div>
    </div>
  );
};

export default ProductionManager;
