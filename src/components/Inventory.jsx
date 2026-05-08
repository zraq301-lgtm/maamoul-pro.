import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, AlertTriangle, Table, LayoutGrid, 
  TrendingUp, DollarSign, Download, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryERPPro = ({ categories, onBack, onUpdateItem, onDeleteItem, onAddNewItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); 
  const [viewMode, setViewMode] = useState('table');

  // تصفية البيانات القادمة من App.jsx بناءً على التبويب المختار
  const displayData = useMemo(() => {
    return activeTab === 'raw'
      ? categories.filter(cat => !cat.name.includes("جاهز"))
      : categories.filter(cat => cat.name.includes("جاهز"));
  }, [categories, activeTab]);

  // إحصائيات ERP
  const stats = useMemo(() => {
    const totalValue = displayData.reduce((sum, item) => sum + ((item.balance || 0) * (item.price || 0)), 0);
    const lowStock = displayData.filter(item => item.balance < 5 && item.name);
    return { totalValue, count: displayData.length, lowStock };
  }, [displayData]);

  // دالة الإضافة السريعة (تنشئ الكائن وترسله فوراً للـ App)
  const handleQuickAdd = () => {
    const newItem = {
      id: Date.now(),
      name: activeTab === 'finished' ? 'منتج جاهز جديد' : 'مادة خام جديدة',
      unit: 'وحدة',
      balance: 0,
      price: 0
    };
    onAddNewItem(newItem);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(wb, `جرد_${activeTab}.xlsx`);
  };

  const styles = {
    excelHeader: { background: '#1e5631', color: 'white', padding: '12px', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #144024' },
    excelCell: { border: '1px solid #e2e8f0', padding: '0' },
    excelInput: { width: '100%', border: 'none', padding: '12px', outline: 'none', background: 'transparent', fontSize: '0.95rem' },
    tabBtn: (active) => ({
      padding: '10px 25px', borderRadius: '8px 8px 0 0', border: 'none',
      background: active ? '#fff' : 'transparent',
      color: active ? '#1e5631' : '#64748b',
      fontWeight: 'bold', cursor: 'pointer', borderBottom: active ? '3px solid #1e5631' : 'none'
    })
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      
      {/* 1. Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', borderRight: '6px solid #1e5631', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>إجمالي القيمة المالية ({activeTab === 'raw' ? 'الخام' : 'المنتج'})</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e5631' }}>{stats.totalValue.toLocaleString()} ج.م</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', borderRight: '6px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>عدد الأصناف الحالية</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900' }}>{stats.count} صنف</div>
        </div>
      </div>

      {/* 2. Alert Bar */}
      {stats.lowStock.length > 0 && (
        <div style={{ background: '#fff1f2', color: '#be123c', padding: '12px', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <AlertTriangle size={20} />
          <marquee>تنبيه: الكمية منخفضة في {stats.lowStock.map(i => i.name).join(' - ')}</marquee>
        </div>
      )}

      {/* 3. Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex' }}>
          <button onClick={() => setActiveTab('raw')} style={styles.tabBtn(activeTab === 'raw')}><Layers size={18} /> جرد المواد الخام</button>
          <button onClick={() => setActiveTab('finished')} style={styles.tabBtn(activeTab === 'finished')}><Archive size={18} /> المنتج النهائي</button>
        </div>
        <div style={{ paddingBottom: '10px', display: 'flex', gap: '10px' }}>
          <button onClick={handleQuickAdd} style={{ background: '#1e5631', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={18}/> صنف جديد</button>
          <button onClick={exportToExcel} style={{ background: '#fff', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}><Download size={18}/></button>
        </div>
      </div>

      {/* 4. The Spreadsheet (Excel Sheet) */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={styles.excelHeader}>اسم الصنف</th>
              <th style={styles.excelHeader}>الكمية (الرصيد)</th>
              <th style={styles.excelHeader}>الوحدة</th>
              <th style={styles.excelHeader}>سعر الوحدة</th>
              <th style={styles.excelHeader}>الإجمالي</th>
              <th style={{...styles.excelHeader, background: '#991b1b'}}>حذف</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((item) => (
              <tr key={item.id} style={{ transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={styles.excelCell}>
                  <input 
                    style={{...styles.excelInput, fontWeight: 'bold'}} 
                    value={item.name} 
                    onChange={(e) => onUpdateItem({...item, name: e.target.value})} 
                  />
                </td>
                <td style={styles.excelCell}>
                  <input 
                    type="number" 
                    style={{...styles.excelInput, color: item.balance < 5 ? '#ef4444' : '#1e293b', textAlign: 'center'}} 
                    value={item.balance} 
                    onChange={(e) => onUpdateItem({...item, balance: parseFloat(e.target.value) || 0})} 
                  />
                </td>
                <td style={styles.excelCell}>
                  <input 
                    style={{...styles.excelInput, textAlign: 'center'}} 
                    value={item.unit} 
                    onChange={(e) => onUpdateItem({...item, unit: e.target.value})} 
                  />
                </td>
                <td style={styles.excelCell}>
                  <input 
                    type="number" 
                    style={{...styles.excelInput, textAlign: 'center'}} 
                    value={item.price} 
                    onChange={(e) => onUpdateItem({...item, price: parseFloat(e.target.value) || 0})} 
                  />
                </td>
                <td style={{...styles.excelCell, textAlign: 'center', fontWeight: 'bold', color: '#166534', background: '#f0fdf4'}}>
                  {((item.balance || 0) * (item.price || 0)).toLocaleString()}
                </td>
                <td style={{...styles.excelCell, textAlign: 'center'}}>
                  <button onClick={() => onDeleteItem(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayData.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>لا توجد بيانات مسجلة في هذا القسم.</div>
        )}
      </div>

      <button onClick={onBack} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
        <ArrowRight size={20} /> العودة للوحة التحكم
      </button>
    </div>
  );
};

export default InventoryERPPro;
