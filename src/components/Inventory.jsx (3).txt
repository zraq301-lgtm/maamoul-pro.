import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, Layers, Activity, AlertTriangle, Table, LayoutGrid } from 'lucide-react';
import DataGrid from './DataGrid';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

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
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '120px' }}>

      {alerts.length > 0 && (
        <div style={{ background: 'rgba(254, 226, 226, 0.8)', borderRight: '5px solid #ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <marquee style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>
            تنبيه نقص مخزن: {alerts.map(a => `${a.name} (${a.balance})`).join(' | ')} - يرجى طلب توريد فوري!
          </marquee>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#1e5631', color: '#fff', padding: '12px', borderRadius: '15px' }}>
            {activeTab === 'raw' ? <FileSpreadsheet size={24} /> : <Package size={24} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
              {activeTab === 'raw' ? 'مخزن المواد الخام' : 'طلبيات المنتج النهائي'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <Activity size={14} color="#1e5631" />
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e5631' }}>
                الرصيد الفعلي: {totalActualStock.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={22} color="#1e293b" />
        </button>
      </div>

      <div style={{ display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold', fontFamily: "'Tajawal', sans-serif", cursor: 'pointer' }}>
          <Layers size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold', fontFamily: "'Tajawal', sans-serif", cursor: 'pointer' }}>
          <Archive size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} /> المنتج النهائي
        </button>
      </div>

      <div className="view-toggle" style={{ marginBottom: '16px' }}>
        <button className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
          <Table size={14} style={{ display: 'inline', marginLeft: '4px' }} /> عرض جدول
        </button>
        <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
          <LayoutGrid size={14} style={{ display: 'inline', marginLeft: '4px' }} /> عرض بطاقات
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="glass-card" style={{ padding: '12px' }}>
          <DataGrid
            columns={gridColumns}
            data={gridData.filter(r => r.name)}
            onCellEdit={handleCellEdit}
            onBulkDelete={setStock ? handleBulkDelete : undefined}
            exportFileName="مخزون_المستودع"
            editable={!!setStock}
          />
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#1e5631', color: 'white' }}>
                  <th style={{ padding: '12px', width: '40px' }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>الصنف</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الوحدة</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>السعر</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: row.isNew ? 'rgba(240,253,244,0.5)' : (idx % 2 === 0 ? '#fff' : '#f9fafb') }}>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td style={{ padding: '4px' }}><input value={row.name} onChange={e => handleCellChange(row.id, 'name', e.target.value)} placeholder="اسم الصنف..." style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '4px' }}><input value={row.unit} onChange={e => handleCellChange(row.id, 'unit', e.target.value)} placeholder="كيلو" style={{ width: '80px', border: 'none', background: 'transparent', padding: '8px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none' }} /></td>
                    <td style={{ padding: '4px' }}><input type="number" inputMode="decimal" value={row.balance} onChange={e => handleCellChange(row.id, 'balance', e.target.value)} placeholder="0" style={{ width: '80px', border: 'none', background: 'transparent', padding: '8px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none', direction: 'ltr' }} /></td>
                    <td style={{ padding: '4px' }}><input type="number" inputMode="decimal" value={row.price} onChange={e => handleCellChange(row.id, 'price', e.target.value)} placeholder="0" style={{ width: '80px', border: 'none', background: 'transparent', padding: '8px', textAlign: 'center', fontFamily: "'Tajawal', sans-serif", fontSize: '0.9rem', outline: 'none', direction: 'ltr' }} /></td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1e5631' }}>{row.total?.toLocaleString() || 0}</td>
                    <td style={{ padding: '4px', textAlign: 'center' }}>
                      <button onClick={() => handleDeleteProcess(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={extendSheet} style={{ width: '100%', padding: '12px', border: 'none', background: '#f0fdf4', color: '#1e5631', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Tajawal', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> إضافة 5 صفوف جديدة
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;
