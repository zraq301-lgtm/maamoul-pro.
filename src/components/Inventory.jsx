import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, Activity, AlertTriangle, Table, LayoutGrid, TrendingUp, 
  DollarSign, BarChart3, Save, X, History, ArrowDownCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [gridData, setGridData] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [inventoryLog, setInventoryLog] = useState(() => {
    const savedLog = localStorage.getItem('inventory_logs');
    return savedLog ? JSON.parse(savedLog) : [];
  });

  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'كيلو',
    balance: '',
    price: '',
    category: 'raw'
  });

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw'
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : (activeTab === 'finished' 
          ? safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")))
          : []);

    const initialRows = filtered.map(cat => ({
      ...cat,
      total: (Number(cat.balance) || 0) * (Number(cat.price) || 0),
    }));

    setGridData(initialRows);
  }, [activeTab, categories]);

  const stats = useMemo(() => {
    const totalValue = gridData.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const lowStockCount = gridData.filter(item => Number(item.balance) < 5 && item.name).length;
    return { totalValue, lowStockCount };
  }, [gridData]);

  // --- تفعيل زر الحفظ وإصلاح معالجة الأرقام ---
  const handleAddNewItem = () => {
    if (!newItem.name || newItem.balance === '' || newItem.price === '') {
      Swal.fire({ title: 'نقص بيانات', text: 'يرجى ملء جميع الحقول الأساسية', icon: 'warning', timer: 2000 });
      return;
    }

    const qtyToAdd = Number(newItem.balance);
    const newPrice = Number(newItem.price);
    const entryDate = new Date().toISOString().split('T')[0];

    // 1. تحديث سجل الإكسيل
    const logEntry = {
      id: Date.now(),
      date: entryDate,
      name: newItem.name,
      unit: newItem.unit,
      quantity: qtyToAdd,
      price: newPrice,
      total: qtyToAdd * newPrice,
      type: 'إضافة'
    };
    setInventoryLog(prev => [logEntry, ...prev]);

    // 2. البحث عن الصنف وتحديثه أو إضافة صنف جديد
    const existingItem = categories.find(item => item.name.trim() === newItem.name.trim());

    if (existingItem) {
      const updatedItem = {
        ...existingItem,
        balance: Number(existingItem.balance) + qtyToAdd,
        price: newPrice,
        total: (Number(existingItem.balance) + qtyToAdd) * newPrice
      };
      
      if (onUpdateItem) onUpdateItem(updatedItem);
    } else {
      const itemToAdd = {
        ...newItem,
        id: `item-${Date.now()}`,
        date: entryDate,
        balance: qtyToAdd,
        price: newPrice,
        total: qtyToAdd * newPrice
      };
      
      if (onAddItem) onAddItem(itemToAdd);
    }

    Swal.fire({ title: 'تم الحفظ', text: `تم تحديث مخزون ${newItem.name}`, icon: 'success', timer: 1500 });
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '', category: 'raw' });
  };

  const ExcelView = () => (
    <div className="glass-card" style={{ overflowX: 'auto', background: '#fff', borderRadius: '15px', padding: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={tableHeaderStyle}>التاريخ</th>
            <th style={tableHeaderStyle}>الصنف</th>
            <th style={tableHeaderStyle}>الكمية</th>
            <th style={tableHeaderStyle}>السعر</th>
            <th style={tableHeaderStyle}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {inventoryLog.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={tableCellStyle}>{log.date}</td>
              <td style={tableCellStyle}><strong>{log.name}</strong></td>
              <td style={{ ...tableCellStyle, color: '#1e5631', fontWeight: 'bold' }}>+{log.quantity}</td>
              <td style={tableCellStyle}>{log.price.toLocaleString()} ج.م</td>
              <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{log.total.toLocaleString()} ج.م</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ProductCard = ({ item }) => (
    <div className="glass-card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ background: '#1e563120', padding: '10px', borderRadius: '12px' }}>
          <Package size={20} color="#1e5631" />
        </div>
        <button onClick={() => onDeleteItem && onDeleteItem(item.id)} style={{ border: 'none', background: 'none', color: '#ef4444' }}>
          <Trash2 size={18} />
        </button>
      </div>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{item.name}</h3>
      <div style={cardGridStyle}>
        <div>
          <p style={labelSmall}>الرصيد</p>
          <p style={{ ...valueMedium, color: Number(item.balance) < 5 ? '#ef4444' : '#1e293b' }}>
            {item.balance} {item.unit}
          </p>
        </div>
        <div>
          <p style={labelSmall}>السعر</p>
          <p style={valueMedium}>{Number(item.price).toLocaleString()} ج.م</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <div style={statsContainer}>
        <div style={statBox}>
          <BarChart3 size={20} color="#1e5631" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>إجمالي القيمة</p>
            <p style={{ fontWeight: 'bold' }}>{stats.totalValue.toLocaleString()} ج.م</p>
          </div>
        </div>
        <div style={{ ...statBox, borderRight: '4px solid #ef4444' }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>نقص مخزون</p>
            <p style={{ fontWeight: 'bold' }}>{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>المخزن</h2>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtnMain}>
          <Plus size={18} /> توريد جديد
        </button>
      </div>

      <div style={tabContainer}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabStyle : tabStyle}>خامات</button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabStyle : tabStyle}>منتجات</button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabStyle : tabStyle}>السجل</button>
      </div>

      {activeTab === 'log' ? <ExcelView /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
          {gridData.map(item => <ProductCard key={item.id} item={item} />)}
        </div>
      )}

      {isAddModalOpen && (
        <div style={modalOverlay}>
          <div className="glass-card" style={modalContent}>
            <h3 style={{ marginTop: 0 }}>إضافة توريد للمخزن</h3>
            <div style={formGroup}>
              <label style={labelSmall}>اسم الصنف</label>
              <input style={inputStyle} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="دقيق، سكر..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={formGroup}>
                <label style={labelSmall}>الكمية</label>
                <input type="number" style={inputStyle} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} />
              </div>
              <div style={formGroup}>
                <label style={labelSmall}>السعر</label>
                <input type="number" style={inputStyle} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
            </div>
            <button onClick={handleAddNewItem} style={saveBtn}><Save size={18} /> حفظ البيانات</button>
            <button onClick={() => setIsAddModalOpen(false)} style={{ ...saveBtn, background: '#ccc', marginTop: '8px' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = { padding: '10px', background: '#f8fafc', textAlign: 'right' };
const tableCellStyle = { padding: '10px', borderBottom: '1px solid #f1f5f9' };
const statsContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' };
const statBox = { background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', borderRight: '4px solid #1e5631', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const labelSmall = { fontSize: '0.7rem', color: '#64748b', margin: 0 };
const valueMedium = { fontSize: '0.95rem', fontWeight: 'bold', margin: 0 };
const cardStyle = { background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 3px 10px rgba(0,0,0,0.04)' };
const cardGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' };
const tabContainer = { display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '15px' };
const tabStyle = { flex: 1, padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer' };
const activeTabStyle = { ...tabStyle, background: '#fff', fontWeight: 'bold', borderRadius: '10px' };
const addBtnMain = { background: '#1e5631', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', display: 'flex', gap: '5px', alignItems: 'center' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: '#fff', width: '90%', maxWidth: '350px', padding: '20px', borderRadius: '20px' };
const formGroup = { marginBottom: '12px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px' };
const saveBtn = { width: '100%', padding: '12px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px' };

export default Inventory;
