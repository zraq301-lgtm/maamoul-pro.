import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, 
  Archive, Layers, Activity, AlertTriangle, Table, 
  LayoutGrid, Edit3, ClipboardList, TrendingUp, DollarSign 
} from 'lucide-react';
import DataGrid from './DataGrid';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('grid'); // افتراضيًا عرض بطاقات
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const totalActualStock = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
  }, [gridData]);

  const totalStockValue = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  }, [gridData]);

  const createEmptyRow = () => ({
    id: `new-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    date: new Date().toISOString().split('T')[0],
    unit: '',
    balance: '',
    price: '',
    total: 0,
    isNew: true
  });

  useEffect(() => {
    const lowStockItems = gridData.filter(item =>
      item.name && item.balance !== '' && parseFloat(item.balance) < 5
    );
    setAlerts(lowStockItems);
  }, [gridData]);

  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw'
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));

    const initialRows = filtered.map(cat => ({
      id: cat.id,
      name: cat.name || '',
      date: cat.date || new Date().toISOString().split('T')[0],
      unit: cat.unit || '',
      balance: cat.balance || '',
      price: cat.price || '',
      total: (parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0),
      isNew: false
    }));

    if (activeTab === 'raw') {
      setGridData([...initialRows, ...Array(5).fill(null).map(createEmptyRow)]);
    } else {
      setGridData(initialRows);
    }
  }, [activeTab, categories]);

  const handleCellChange = (id, field, value) => {
    setGridData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'balance' || field === 'price') {
          const b = field === 'balance' ? parseFloat(value) : parseFloat(item.balance);
          const p = field === 'price' ? parseFloat(value) : parseFloat(item.price);
          updatedItem.total = (b || 0) * (p || 0);
        }
        if (onUpdateItem) onUpdateItem(updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };

  const handleDeleteProcess = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصنف نهائياً؟")) {
      if (onDeleteItem) onDeleteItem(id);
      setGridData(prev => prev.filter(item => item.id !== id));
    }
  };

  const extendSheet = () => {
    setGridData(prev => [...prev, ...Array(5).fill(null).map(createEmptyRow)]);
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '120px' }}>
      
      {/* التنبيهات الذكية */}
      {alerts.length > 0 && (
        <div style={{ background: '#fef2f2', borderRight: '5px solid #ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ whiteSpace: 'nowrap', animation: 'scroll 20s linear infinite', color: '#991b1b', fontWeight: 'bold', fontSize: '0.85rem' }}>
              نظام الجرد الذكي: {alerts.map(a => `${a.name} (${a.balance})`).join(' | ')} - يرجى مراجعة النواقص!
            </div>
          </div>
        </div>
      )}

      {/* الهيدر العلوي - نظام ERP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e5631 0%, #2d8a4e 100%)', color: '#fff', padding: '15px', borderRadius: '18px', boxShadow: '0 10px 15px -3px rgba(30, 86, 49, 0.3)' }}>
            {activeTab === 'raw' ? <ClipboardList size={28} /> : <Package size={28} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>
              {activeTab === 'raw' ? 'إدارة مخزن المواد الخام' : 'مخزن المنتج النهائي'}
            </h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} /> إجمالي الكميات: <b>{totalActualStock.toLocaleString()}</b>
              </span>
              <span style={{ fontSize: '0.8rem', color: '#1e5631', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={14} /> قيمة المخزون: <b>{totalStockValue.toLocaleString()}</b>
              </span>
            </div>
          </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
          <ArrowRight size={24} color="#1e293b" />
        </button>
      </div>

      {/* التبديل بين الأقسام */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '6px', borderRadius: '16px', marginBottom: '25px', gap: '6px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
          <Layers size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
          <Archive size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> المنتج النهائي
        </button>
      </div>

      {/* اختيار طريقة العرض */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '10px' }}>
        <button onClick={() => setViewMode('table')} style={{ padding: '8px 15px', borderRadius: '10px', border: 'none', background: viewMode === 'table' ? '#1e5631' : '#fff', color: viewMode === 'table' ? '#fff' : '#64748b', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Table size={16} /> جدول
        </button>
        <button onClick={() => setViewMode('grid')} style={{ padding: '8px 15px', borderRadius: '10px', border: 'none', background: viewMode === 'grid' ? '#1e5631' : '#fff', color: viewMode === 'grid' ? '#fff' : '#64748b', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LayoutGrid size={16} /> بطاقات الجرد
        </button>
      </div>

      {viewMode === 'grid' ? (
        /* عرض البطاقات UI/UX Modern Card System */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {gridData.map((item, idx) => (
            <div key={item.id} style={{ 
              background: '#fff', 
              borderRadius: '20px', 
              padding: '20px', 
              position: 'relative', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              transition: 'transform 0.2s',
              borderTop: item.isNew ? '4px solid #10b981' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ background: '#f1f5f9', padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                  #{idx + 1}
                </div>
                <button onClick={() => handleDeleteProcess(item.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              {/* مدخلات الجرد داخل البطاقة */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>اسم الصنف</label>
                <input 
                  value={item.name} 
                  onChange={e => handleCellChange(item.id, 'name', e.target.value)}
                  placeholder="مثال: دقيق فاخر..."
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', fontFamily: 'inherit', fontWeight: 'bold', outline: 'none', color: '#1e293b' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>الكمية (الجرد)</label>
                  <input 
                    type="number"
                    value={item.balance} 
                    onChange={e => handleCellChange(item.id, 'balance', e.target.value)}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center', fontWeight: '900', color: '#1e5631' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>سعر الوحدة</label>
                  <input 
                    type="number"
                    value={item.price} 
                    onChange={e => handleCellChange(item.id, 'price', e.target.value)}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center', fontWeight: '900', color: '#1e5631' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '15px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>إجمالي القيمة</div>
                  <div style={{ fontWeight: '900', color: '#1e5631' }}>{item.total?.toLocaleString() || 0} ج.م</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold',
                    backgroundColor: (parseFloat(item.balance) || 0) < 5 ? '#fef2f2' : '#f0fdf4',
                    color: (parseFloat(item.balance) || 0) < 5 ? '#ef4444' : '#1e5631'
                  }}>
                    {(parseFloat(item.balance) || 0) < 5 ? 'مخزن منخفض' : 'حالة جيدة'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <button onClick={extendSheet} style={{ border: '2px dashed #cbd5e1', borderRadius: '20px', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '40px', color: '#64748b', transition: '0.3s' }}>
             <Plus size={32} />
             <span style={{ fontWeight: 'bold' }}>إضافة أصناف جديدة للجرد</span>
          </button>
        </div>
      ) : (
        /* العرض التقليدي للجدول في حال الحاجة إليه */
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
           <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
               <thead>
                 <tr style={{ background: '#1e5631', color: 'white' }}>
                   <th style={{ padding: '15px', textAlign: 'right' }}>الصنف</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>الكمية</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>السعر</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>الإجمالي</th>
                   <th style={{ padding: '15px', textAlign: 'center' }}>حذف</th>
                 </tr>
               </thead>
               <tbody>
                 {gridData.map((row) => (
                   <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '10px' }}>
                       <input value={row.name} onChange={e => handleCellChange(row.id, 'name', e.target.value)} style={{ width: '100%', border: 'none', padding: '8px', fontFamily: 'inherit' }} />
                     </td>
                     <td style={{ padding: '10px' }}>
                       <input type="number" value={row.balance} onChange={e => handleCellChange(row.id, 'balance', e.target.value)} style={{ width: '80px', border: '1px solid #eee', borderRadius: '5px', textAlign: 'center' }} />
                     </td>
                     <td style={{ padding: '10px' }}>
                       <input type="number" value={row.price} onChange={e => handleCellChange(row.id, 'price', e.target.value)} style={{ width: '80px', border: '1px solid #eee', borderRadius: '5px', textAlign: 'center' }} />
                     </td>
                     <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{row.total?.toLocaleString()}</td>
                     <td style={{ padding: '10px', textAlign: 'center' }}>
                       <button onClick={() => handleDeleteProcess(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none' }}><Trash2 size={16} /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <button onClick={extendSheet} style={{ width: '100%', padding: '15px', border: 'none', background: '#f0fdf4', color: '#1e5631', fontWeight: 'bold', cursor: 'pointer' }}>+ إضافة صفوف إضافية</button>
        </div>
      )}

      {/* CSS Animation for the alert marquee */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
