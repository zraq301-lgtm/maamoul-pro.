import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, Save, History, Search
} from 'lucide-react';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw', 'finished', 'log'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // سجل العمليات (الواردات) - مخزن محلياً
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

  // حفظ السجل تلقائياً عند التغيير
  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // تصفية البيانات بناءً على التبويب والبحث
  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    
    let baseList = [];
    if (activeTab === 'raw') {
      baseList = safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"));
    } else if (activeTab === 'finished') {
      baseList = safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
    }

    if (searchTerm) {
      baseList = baseList.filter(item => item.name.includes(searchTerm));
    }

    return baseList.map(item => ({
      ...item,
      total: (Number(item.balance) || 0) * (Number(item.price) || 0)
    }));
  }, [activeTab, categories, searchTerm]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.total, 0);
    const lowStock = filteredData.filter(item => Number(item.balance) < 10).length;
    return { totalValue, lowStock };
  }, [filteredData]);

  // --- دالة المعالجة الاحترافية للإضافة والتحديث ---
  const handleProcessEntry = () => {
    const { name, balance, price, unit } = newItem;

    if (!name || !balance || !price) {
      Swal.fire({ title: 'بيانات ناقصة', text: 'يرجى إكمال الحقول المطلوبة', icon: 'error' });
      return;
    }

    const qty = Number(balance);
    const cost = Number(price);
    const entryDate = new Date().toLocaleString('ar-EG');

    // 1. التحقق من وجود الصنف (تجاهل المسافات والتشكيل البسيط)
    const normalizedNewName = name.trim();
    const existingItem = categories.find(item => 
      item.name.trim() === normalizedNewName
    );

    if (existingItem) {
      // تحديث صنف موجود (رفع رصيد)
      const updatedData = {
        ...existingItem,
        balance: Number(existingItem.balance) + qty,
        price: cost, // تحديث للسعر الجديد
      };
      onUpdateItem(updatedData);
    } else {
      // إضافة صنف جديد كلياً
      const newEntry = {
        id: `item-${Date.now()}`,
        name: normalizedNewName,
        unit,
        balance: qty,
        price: cost,
        category: 'raw',
        date: entryDate
      };
      onAddItem(newEntry);
    }

    // 2. إضافة العملية إلى سجل الواردات
    const logEntry = {
      id: Date.now(),
      date: entryDate,
      name: normalizedNewName,
      quantity: qty,
      price: cost,
      total: qty * cost,
      type: 'وارد'
    };
    setInventoryLog(prev => [logEntry, ...prev]);

    Swal.fire({
      icon: 'success',
      title: existingItem ? 'تم رفع الرصيد' : 'تم إضافة الصنف',
      text: `الصنف: ${normalizedNewName} | الكمية: ${qty}`,
      timer: 1500,
      showConfirmButton: false
    });

    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '', category: 'raw' });
  };

  return (
    <div style={containerStyle}>
      {/* ملخص سريع */}
      <div style={statsRow}>
        <div style={statCard}>
          <BarChart3 color="#1e5631" size={20} />
          <div>
            <span style={statLabel}>إجمالي القيمة</span>
            <div style={statValue}>{stats.totalValue.toLocaleString()} ج.م</div>
          </div>
        </div>
        <div style={{ ...statCard, borderRight: '4px solid #ef4444' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <div>
            <span style={statLabel}>أصناف منخفضة</span>
            <div style={statValue}>{stats.lowStock} صنف</div>
          </div>
        </div>
      </div>

      {/* أدوات التحكم */}
      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث في المخزن..." 
            style={searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}>
          <Plus size={18} /> توريد خامات
        </button>
      </div>

      {/* التبويبات */}
      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>
          <Package size={16} /> الخامات
        </button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>
          <Save size={16} /> المنتجات
        </button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>
          <History size={16} /> سجل الوارد
        </button>
      </div>

      {/* عرض البيانات */}
      {activeTab === 'log' ? (
        <div className="glass-card" style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>الصنف</th>
                <th style={thStyle}>الكمية</th>
                <th style={thStyle}>السعر</th>
                <th style={thStyle}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLog.map(log => (
                <tr key={log.id} style={trStyle}>
                  <td style={tdStyle}>{log.date.split(',')[0]}</td>
                  <td style={tdStyle}><strong>{log.name}</strong></td>
                  <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 'bold' }}>+{log.quantity}</td>
                  <td style={tdStyle}>{log.price}</td>
                  <td style={tdStyle}>{log.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.map(item => (
            <div key={item.id} className="glass-card" style={itemCard}>
              <div style={cardHeader}>
                <span style={unitTag}>{item.unit}</span>
                <button onClick={() => onDeleteItem(item.id)} style={deleteBtn}><Trash2 size={16} /></button>
              </div>
              <h3 style={itemTitle}>{item.name}</h3>
              <div style={itemDetails}>
                <div style={detailBox}>
                  <span style={detailLabel}>الرصيد الحالي</span>
                  <span style={{ ...detailValue, color: item.balance < 10 ? '#ef4444' : '#1e293b' }}>
                    {item.balance}
                  </span>
                </div>
                <div style={detailBox}>
                  <span style={detailLabel}>سعر الوحدة</span>
                  <span style={detailValue}>{item.price} ج.م</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال الإضافة (رفع الرصيد) */}
      {isAddModalOpen && (
        <div style={overlay}>
          <div className="glass-card" style={modal}>
            <h2 style={{ marginBottom: '20px' }}>توريد / إضافة مخزون</h2>
            
            <div style={inputGroup}>
              <label>اسم الصنف</label>
              <input 
                list="items-list"
                style={modalInput} 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="اختر أو اكتب صنف جديد..."
              />
              <datalist id="items-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            <div style={row}>
              <div style={inputGroup}>
                <label>الكمية الموردة</label>
                <input type="number" style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label>سعر الشراء</label>
                <input type="number" style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
            </div>

            <div style={modalActions}>
              <button onClick={handleProcessEntry} style={confirmBtn}>حفظ العملية</button>
              <button onClick={() => setIsAddModalOpen(false)} style={cancelBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- الستايلات الاحترافية ---
const containerStyle = { padding: '15px', direction: 'rtl', fontFamily: 'system-ui' };
const statsRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' };
const statCard = { background: '#fff', padding: '15px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRight: '4px solid #1e5631' };
const statLabel = { fontSize: '11px', color: '#64748b', display: 'block' };
const statValue = { fontSize: '15px', fontWeight: 'bold', color: '#1e293b' };
const headerActions = { display: 'flex', gap: '10px', marginBottom: '15px' };
const searchWrapper = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '0 12px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', padding: '10px', width: '100%', outline: 'none', fontSize: '14px' };
const addBtn = { background: '#1e5631', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', whiteSpace: 'nowrap' };
const tabBar = { display: 'flex', gap: '5px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '20px' };
const tabBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', color: '#64748b' };
const activeTabBtn = { ...tabBtn, background: '#fff', color: '#1e5631', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' };
const itemCard = { background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const unitTag = { fontSize: '10px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' };
const deleteBtn = { border: 'none', background: 'none', color: '#ef4444', padding: '0' };
const itemTitle = { margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' };
const itemDetails = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' };
const detailBox = { textAlign: 'center' };
const detailLabel = { display: 'block', fontSize: '9px', color: '#94a3b8' };
const detailValue = { fontSize: '13px', fontWeight: 'bold' };
const tableContainer = { background: '#fff', borderRadius: '16px', padding: '10px', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' };
const thStyle = { padding: '12px', textAlign: 'right', color: '#64748b', borderBottom: '2px solid #f1f5f9' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tdStyle = { padding: '12px' };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modal = { background: '#fff', width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '24px' };
const inputGroup = { marginBottom: '15px', flex: 1 };
const modalInput = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '6px', outline: 'none' };
const row = { display: 'flex', gap: '10px' };
const modalActions = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' };
const confirmBtn = { padding: '14px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' };
const cancelBtn = { padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px' };

export default Inventory;
