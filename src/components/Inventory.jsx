import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, AlertTriangle, Table, LayoutGrid, 
  TrendingUp, DollarSign, Download, Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryERPPro = ({ categories = [], onBack, onUpdateItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' or 'finished'
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [gridData, setGridData] = useState([]);

  // 1. معالجة البيانات الأولية وتصنيفها
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw'
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));

    setGridData(filtered.map(cat => ({
      ...cat,
      total: (parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0)
    })));
  }, [activeTab, categories]);

  // 2. الحسابات الإحصائية (ERP Analytics)
  const stats = useMemo(() => {
    const totalValue = gridData.reduce((sum, item) => sum + (item.total || 0), 0);
    const lowStockItems = gridData.filter(item => parseFloat(item.balance) < 5 && item.name);
    return {
      totalValue,
      count: gridData.length,
      lowStock: lowStockItems
    };
  }, [gridData]);

  // 3. وظائف التحكم (Actions)
  const handleCellChange = (id, field, value) => {
    setGridData(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'balance' || field === 'price') {
          updated.total = (parseFloat(updated.balance) || 0) * (parseFloat(updated.price) || 0);
        }
        if (onUpdateItem) onUpdateItem(updated);
        return updated;
      }
      return item;
    }));
  };

  const addNewRow = () => {
    const newRow = {
      id: Date.now(),
      name: '',
      unit: 'وحدة',
      balance: 0,
      price: 0,
      total: 0,
      isNew: true
    };
    setGridData([newRow, ...gridData]);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(gridData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(wb, `جرد_${activeTab === 'raw' ? 'الخام' : 'النهائي'}.xlsx`);
  };

  const styles = {
    card: { background: 'white', borderRadius: '15px', padding: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    input: { width: '100%', border: 'none', background: 'transparent', padding: '8px', fontFamily: 'inherit', outline: 'none' },
    tabBtn: (active) => ({
      flex: 1, padding: '12px', borderRadius: '10px', border: 'none', 
      backgroundColor: active ? '#1e5631' : 'transparent', 
      color: active ? '#fff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
    })
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers color="#1e5631" /> نظام إدارة المخازن الاحترافي
          </h1>
          <p style={{ color: '#64748b', margin: '5px 0' }}>تحكم كامل في الأرصدة والبيانات المالية</p>
        </div>
        <button onClick={onBack} style={{ background: 'white', border: '1px solid #ddd', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={styles.card}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px' }}><DollarSign color="#10b981" /></div>
            <div><small style={{ color: '#64748b' }}>إجمالي القيمة المالية</small>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e5631' }}>{stats.totalValue.toLocaleString()} ج.م</div></div>
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px' }}><Package color="#3b82f6" /></div>
            <div><small style={{ color: '#64748b' }}>عدد الأصناف المسجلة</small>
            <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{stats.count} صنف</div></div>
          </div>
        </div>
      </div>

      {/* Alert Bar */}
      {stats.lowStock.length > 0 && (
        <div style={{ background: '#fff1f2', borderRight: '4px solid #f43f5e', padding: '10px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#f43f5e" size={18} />
          <marquee style={{ color: '#be123c', fontWeight: 'bold', fontSize: '0.9rem' }}>
            تنبيه نواقص: {stats.lowStock.map(i => `${i.name} (باقي ${i.balance})`).join(' | ')}
          </marquee>
        </div>
      )}

      {/* Controls Area */}
      <div style={{ ...styles.card, marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setActiveTab('raw')} style={styles.tabBtn(activeTab === 'raw')}><Layers size={16} /> المواد الخام</button>
          <button onClick={() => setActiveTab('finished')} style={styles.tabBtn(activeTab === 'finished')}><Archive size={16} /> المنتج النهائي</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addNewRow} style={{ background: '#1e5631', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> إضافة صنف
            </button>
            <button onClick={exportToExcel} style={{ background: '#fff', border: '1px solid #1e5631', color: '#1e5631', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> تصدير Excel
            </button>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '8px 15px', border: 'none', borderRadius: '7px', cursor: 'pointer', background: viewMode === 'table' ? '#fff' : 'transparent', boxShadow: viewMode === 'table' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}><Table size={18} /></button>
            <button onClick={() => setViewMode('grid')} style={{ padding: '8px 15px', border: 'none', borderRadius: '7px', cursor: 'pointer', background: viewMode === 'grid' ? '#fff' : 'transparent', boxShadow: viewMode === 'grid' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      {/* Data Presentation */}
      {viewMode === 'table' ? (
        <div style={{ ...styles.card, overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px' }}>الصنف</th>
                <th style={{ padding: '15px' }}>الكمية</th>
                <th style={{ padding: '15px' }}>الوحدة</th>
                <th style={{ padding: '15px' }}>السعر</th>
                <th style={{ padding: '15px' }}>الإجمالي</th>
                <th style={{ padding: '15px' }}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px' }}><input style={{...styles.input, fontWeight: 'bold'}} value={item.name} onChange={e => handleCellChange(item.id, 'name', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}><input type="number" style={{...styles.input, color: item.balance < 5 ? 'red' : 'inherit'}} value={item.balance} onChange={e => handleCellChange(item.id, 'balance', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}><input style={styles.input} value={item.unit} onChange={e => handleCellChange(item.id, 'unit', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}><input type="number" style={styles.input} value={item.price} onChange={e => handleCellChange(item.id, 'price', e.target.value)} /></td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#166534' }}>{item.total.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => onDeleteItem(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {gridData.map(item => (
            <div key={item.id} style={{ ...styles.card, borderRight: `6px solid ${item.balance < 5 ? '#f43f5e' : '#10b981'}` }}>
              <input style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', width: '100%', border: 'none', outline: 'none' }} value={item.name} onChange={e => handleCellChange(item.id, 'name', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <div><small style={{ color: '#64748b' }}>الكمية</small><div><input type="number" style={styles.input} value={item.balance} onChange={e => handleCellChange(item.id, 'balance', e.target.value)} /></div></div>
                <div><small style={{ color: '#64748b' }}>السعر</small><div><input type="number" style={styles.input} value={item.price} onChange={e => handleCellChange(item.id, 'price', e.target.value)} /></div></div>
              </div>
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', color: '#1e5631' }}>{item.total.toLocaleString()} ج.م</span>
                <button onClick={() => onDeleteItem(item.id)} style={{ background: '#fff1f2', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={16} color="#ef4444" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryERPPro;
