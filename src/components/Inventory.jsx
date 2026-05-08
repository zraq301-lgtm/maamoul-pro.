import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, Activity, AlertTriangle, Table, LayoutGrid, 
  ClipboardCheck, BarChart3, TrendingUp, DollarSign 
} from 'lucide-react';
import DataGrid from './DataGrid';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('grid'); // جعلنا العرض الافتراضي هو البطاقات
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // حساب إحصائيات نظام ERP
  const stats = useMemo(() => {
    const totalValue = gridData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const totalItems = gridData.filter(item => item.name).length;
    const lowStockCount = gridData.filter(item => parseFloat(item.balance) < 5 && item.name).length;
    return { totalValue, totalItems, lowStockCount };
  }, [gridData]);

  const totalActualStock = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
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

  const handleCellEdit = (rowId, colKey, value) => {
    handleCellChange(rowId, colKey, value);
  };

  const handleBulkDelete = (ids) => {
    if (!setStock) return;
    setStock(prev => prev.filter(item => !ids.includes(item.id)));
  };

  const gridColumns = [
    { key: 'name', header: 'اسم الصنف', editable: true },
    { key: 'balance', header: 'الرصيد', editable: true, type: 'number', render: v => v?.toLocaleString() },
    { key: 'unit', header: 'الوحدة', editable: true },
    { key: 'price', header: 'السعر', editable: true, type: 'number', render: v => v?.toLocaleString() },
    {
      key: 'total', header: 'قيمة المخزون', editable: false,
      render: (_, row) => ((parseFloat(row.balance) || 0) * (parseFloat(row.price) || 0)).toLocaleString()
    },
    {
      key: 'status', header: 'الحالة', editable: false,
      render: (_, row) => {
        const balance = parseFloat(row.balance) || 0;
        if (balance <= 0) return 'منتهي';
        if (balance < 5) return 'منخفض';
        return 'متوفر';
      }
    },
  ];

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '120px', backgroundColor: '#f8fafc' }}>
      
      {/* ERP Header Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px' }}><DollarSign color="#10b981" /></div>
          <div><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>إجمالي القيمة</p><p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{stats.totalValue.toLocaleString()}</p></div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><Package color="#3b82f6" /></div>
          <div><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>عدد الأصناف</p><p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{stats.totalItems}</p></div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '12px' }}><AlertTriangle color="#f43f5e" /></div>
          <div><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>نواقص</p><p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{stats.lowStockCount}</p></div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ background: 'rgba(254, 226, 226, 0.9)', borderRight: '5px solid #ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <marquee style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>
            تنبيه نقص مخزن: {alerts.map(a => `${a.name} (${a.balance})`).join(' | ')} - يرجى طلب توريد فوري!
          </marquee>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#1e5631', color: '#fff', padding: '12px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(30, 86, 49, 0.3)' }}>
            {activeTab === 'raw' ? <ClipboardCheck size={24} /> : <Package size={24} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
              {activeTab === 'raw' ? 'جرد المدخلات والمواد الخام' : 'طلبيات المنتج النهائي'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <TrendingUp size={14} color="#1e5631" />
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e5631' }}>
                حالة المخزون الحالي: {totalActualStock.toLocaleString()} وحدة
              </span>
            </div>
          </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
          <ArrowRight size={22} color="#1e293b" />
        </button>
      </div>

      <div style={{ display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '18px', marginBottom: '25px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold', fontFamily: "'Tajawal', sans-serif", cursor: 'pointer', transition: 'all 0.3s' }}>
          <Layers size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> جرد المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold', fontFamily: "'Tajawal', sans-serif", cursor: 'pointer', transition: 'all 0.3s' }}>
          <Archive size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> المنتج النهائي
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', color: '#475569', margin: 0 }}>طريقة العرض:</h3>
        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button onClick={() => setViewMode('table')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: viewMode === 'table' ? '#1e5631' : 'transparent', color: viewMode === 'table' ? '#fff' : '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Table size={16} /> جدول
          </button>
          <button onClick={() => setViewMode('grid')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: viewMode === 'grid' ? '#1e5631' : 'transparent', color: viewMode === 'grid' ? '#fff' : '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <LayoutGrid size={16} /> بطاقات
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {gridData.map((item, idx) => (
            item.name || item.isNew ? (
              <div key={item.id} style={{ background: '#fff', borderRadius: '22px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                {item.isNew && <div style={{ position: 'absolute', top: 0, left: 0, background: '#1e5631', color: 'white', padding: '4px 12px', fontSize: '0.7rem', borderBottomRightRadius: '12px' }}>مدخل جديد</div>}
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>اسم الصنف</label>
                  <input 
                    value={item.name} 
                    onChange={e => handleCellChange(item.id, 'name', e.target.value)}
                    placeholder="أدخل اسم الصنف هنا..."
                    style={{ width: '100%', border: '1px solid #f1f5f9', background: '#f8fafc', padding: '10px', borderRadius: '10px', fontWeight: 'bold', outline: 'none', color: '#1e293b' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>الكمية ({item.unit || 'وحدة'})</label>
                    <input 
                      type="number" 
                      value={item.balance} 
                      onChange={e => handleCellChange(item.id, 'balance', e.target.value)}
                      style={{ width: '100%', border: '1px solid #f1f5f9', background: '#f8fafc', padding: '10px', borderRadius: '10px', fontWeight: 'bold', textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>سعر الوحدة</label>
                    <input 
                      type="number" 
                      value={item.price} 
                      onChange={e => handleCellChange(item.id, 'price', e.target.value)}
                      style={{ width: '100%', border: '1px solid #f1f5f9', background: '#f8fafc', padding: '10px', borderRadius: '10px', fontWeight: 'bold', textAlign: 'center' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '12px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#1e5631', display: 'block' }}>القيمة الإجمالية</span>
                    <span style={{ fontWeight: '900', color: '#166534', fontSize: '1.1rem' }}>{item.total?.toLocaleString()} ج.م</span>
                  </div>
                  <button onClick={() => handleDeleteProcess(item.id)} style={{ background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : null
          ))}
          <button onClick={extendSheet} style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', minHeight: '200px', transition: 'all 0.3s' }}>
            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}><Plus size={30} /></div>
            <span style={{ fontWeight: 'bold' }}>إضافة مدخلات جرد جديدة</span>
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#1e5631', color: 'white' }}>
                  <th style={{ padding: '15px', width: '40px' }}>#</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>الصنف</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>الوحدة</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>السعر</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>الإجمالي</th>
                  <th style={{ padding: '15px', textAlign: 'center', width: '50px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: row.isNew ? 'rgba(240,253,244,0.5)' : (idx % 2 === 0 ? '#fff' : '#f9fafb') }}>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td style={{ padding: '6px' }}><input value={row.name} onChange={e => handleCellChange(row.id, 'name', e.target.value)} placeholder="اسم الصنف..." style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '6px' }}><input value={row.unit} onChange={e => handleCellChange(row.id, 'unit', e.target.value)} placeholder="كيلو" style={{ width: '80px', border: 'none', background: 'transparent', padding: '10px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '6px' }}><input type="number" value={row.balance} onChange={e => handleCellChange(row.id, 'balance', e.target.value)} placeholder="0" style={{ width: '80px', border: 'none', background: 'transparent', padding: '10px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '6px' }}><input type="number" value={row.price} onChange={e => handleCellChange(row.id, 'price', e.target.value)} placeholder="0" style={{ width: '80px', border: 'none', background: 'transparent', padding: '10px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e5631' }}>{row.total?.toLocaleString() || 0}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <button onClick={() => handleDeleteProcess(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={extendSheet} style={{ width: '100%', padding: '15px', border: 'none', background: '#f0fdf4', color: '#1e5631', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Tajawal', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> إضافة صفوف جرد إضافية
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;
