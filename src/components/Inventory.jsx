import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, Activity, AlertTriangle, Table, LayoutGrid, TrendingUp, 
  DollarSign, BarChart3, Save, X, History, ArrowDownCircle
} from 'lucide-react';
import DataGrid from './DataGrid';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('grid'); 
  const [gridData, setGridData] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // نظام سجل الإضافات (Excel View State)
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

  // حفظ سجل الإكسيل
  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // تحديث البيانات المعروضة فور تغير categories (القادمة من App.jsx)
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw'
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : (activeTab === 'finished' 
          ? safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")))
          : []);

    const initialRows = filtered.map(cat => ({
      ...cat,
      total: (parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0),
    }));

    setGridData(initialRows);
  }, [activeTab, categories]);

  const stats = useMemo(() => {
    const totalValue = gridData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const lowStockCount = gridData.filter(item => parseFloat(item.balance) < 5 && item.name).length;
    return { totalValue, lowStockCount };
  }, [gridData]);

  // --- النظام الذكي للإضافة ورفع الرصيد المباشر ---
  const handleAddNewItem = () => {
    if (!newItem.name || !newItem.balance || !newItem.price) {
      Swal.fire({ title: 'نقص بيانات', text: 'يرجى ملء جميع الحقول الأساسية', icon: 'warning', timer: 2000 });
      return;
    }

    const qtyToAdd = parseFloat(newItem.balance);
    const newPrice = parseFloat(newItem.price);
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

    // 2. البحث عن الصنف لرفع الرصيد (الذكاء المباشر)
    const existingItem = categories.find(item => item.name.trim() === newItem.name.trim());

    if (existingItem) {
      // رفع الرصيد الموجود في الصورة
      const updatedItem = {
        ...existingItem,
        balance: parseFloat(existingItem.balance) + qtyToAdd,
        price: newPrice, // تحديث لآخر سعر توريد
        total: (parseFloat(existingItem.balance) + qtyToAdd) * newPrice
      };
      
      if (onUpdateItem) {
        onUpdateItem(updatedItem); // يرفع الرصيد في App.jsx
      } else if (setStock) {
        setStock(prev => prev.map(i => i.id === existingItem.id ? updatedItem : i));
      }
    } else {
      // فتح فئة جديدة إذا لم تكن موجودة
      const itemToAdd = {
        ...newItem,
        id: `item-${Date.now()}`,
        date: entryDate,
        balance: qtyToAdd,
        price: newPrice,
        total: qtyToAdd * newPrice
      };
      
      if (onAddItem) {
        onAddItem(itemToAdd);
      } else if (setStock) {
        setStock(prev => [...prev, itemToAdd]);
      }
    }

    Swal.fire({ title: 'تم رفع الرصيد', text: `تمت إضافة ${qtyToAdd} إلى ${newItem.name}`, icon: 'success', timer: 1500 });
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
            <th style={tableHeaderStyle}>الكمية المضافة</th>
            <th style={tableHeaderStyle}>السعر</th>
            <th style={tableHeaderStyle}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {inventoryLog.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={tableCellStyle}>{log.date}</td>
              <td style={tableCellStyle}><strong>{log.name}</strong></td>
              <td style={{ ...tableCellStyle, color: '#1e5631', fontWeight: 'bold' }}>+{log.quantity} {log.unit}</td>
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
      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{item.name}</h3>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>وحدة القياس: {item.unit}</span>
      <div style={cardGridStyle}>
        <div>
          <p style={labelSmall}>الرصيد الحالي</p>
          <p style={{ ...valueMedium, fontSize: '1.3rem', color: parseFloat(item.balance) < 5 ? '#ef4444' : '#1e293b' }}>
            {item.balance}
          </p>
        </div>
        <div>
          <p style={labelSmall}>التكلفة/وحدة</p>
          <p style={valueMedium}>{parseFloat(item.price).toLocaleString()} ج.م</p>
        </div>
      </div>
      <div style={cardFooterStyle}>
        <span>إجمالي القيمة:</span>
        <span style={{ fontWeight: 'bold' }}>{(item.balance * item.price).toLocaleString()} ج.م</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '120px' }}>
      
      {/* إحصائيات المخزن */}
      <div style={statsContainer}>
        <div style={statBox}>
          <BarChart3 size={20} color="#1e5631" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>قيمة المخزون</p>
            <p style={{ fontWeight: 'bold' }}>{stats.totalValue.toLocaleString()} ج.م</p>
          </div>
        </div>
        <div style={{ ...statBox, borderRight: '4px solid #ef4444' }}>
          <TrendingUp size={20} color="#ef4444" />
          <div style={{ marginRight: '10px' }}>
            <p style={labelSmall}>أصناف منخفضة</p>
            <p style={{ fontWeight: 'bold' }}>{stats.lowStockCount} صنف</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>المستودع الذكي ERP</h2>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtnMain}>
          <Plus size={20} /> إضافة / توريد
        </button>
      </div>

      <div style={tabContainer}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabStyle : tabStyle}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabStyle : tabStyle}>المنتج النهائي</button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabStyle : tabStyle}>سجل الوارد</button>
      </div>

      {activeTab === 'log' ? <ExcelView /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
          {gridData.map(item => <ProductCard key={item.id} item={item} />)}
        </div>
      )}

      {isAddModalOpen && (
        <div style={modalOverlay}>
          <div className="glass-card" style={modalContent}>
            <h3 style={{ marginTop: 0 }}>تحديث الرصيد / توريد</h3>
            <div style={formGroup}>
              <label style={labelSmall}>اسم الصنف</label>
              <input style={inputStyle} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="دقيق، تمر، الخ..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={formGroup}>
                <label style={labelSmall}>الكمية المضافة</label>
                <input type="number" style={inputStyle} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} />
              </div>
              <div style={formGroup}>
                <label style={labelSmall}>السعر الجديد</label>
                <input type="number" style={inputStyle} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
            </div>
            <button onClick={handleAddNewItem} style={saveBtn}><Save size={18} /> حفظ وتحديث المخزن</button>
            <button onClick={() => setIsAddModalOpen(false)} style={{ ...saveBtn, background: '#ccc', marginTop: '5px' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات
const tableHeaderStyle = { padding: '10px', background: '#f1f5f9', textAlign: 'right' };
const tableCellStyle = { padding: '10px', borderBottom: '1px solid #f1f5f9' };
const statsContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' };
const statBox = { background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', borderRight: '4px solid #1e5631', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const labelSmall = { fontSize: '0.75rem', color: '#64748b', margin: 0 };
const valueMedium = { fontSize: '1rem', fontWeight: 'bold', margin: 0 };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const cardGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' };
const cardFooterStyle = { marginTop: '15px', display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', padding: '10px', borderRadius: '12px', color: '#1e5631' };
const tabContainer = { display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' };
const activeTabStyle = { ...tabStyle, background: '#fff', fontWeight: 'bold', borderRadius: '12px' };
const addBtnMain = { background: '#1e5631', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', display: 'flex', gap: '8px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: '#fff', width: '90%', maxWidth: '400px', padding: '25px', borderRadius: '25px' };
const formGroup = { marginBottom: '15px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginTop: '5px' };
const saveBtn = { width: '100%', padding: '12px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px' };

export default Inventory;
