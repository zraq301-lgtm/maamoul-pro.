import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, Save, History, Search, X
} from 'lucide-react';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [inventoryLog, setInventoryLog] = useState(() => {
    try {
      const savedLog = localStorage.getItem('inventory_logs');
      return savedLog ? JSON.parse(savedLog) : [];
    } catch (e) {
      return [];
    }
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

  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    let baseList = safeCategories.filter(item => {
      if (!item.name) return false;
      const itemName = item.name.toLowerCase();
      const matchesSearch = itemName.includes(searchTerm.toLowerCase());
      if (activeTab === 'raw') {
        return matchesSearch && !itemName.includes("معمول") && !itemName.includes("جاهز");
      } else if (activeTab === 'finished') {
        return matchesSearch && (itemName.includes("معمول") || itemName.includes("جاهز"));
      }
      return false;
    });
    return baseList.map(item => ({
      ...item,
      total: (Number(item.balance) || 0) * (Number(item.price) || 0)
    }));
  }, [activeTab, categories, searchTerm]);

  const stats = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.total, 0);
    const lowStock = filteredData.filter(item => Number(item.balance) < 10).length;
    return { totalValue, lowStock };
  }, [filteredData]);

  // --- دالة تحويل الأرقام العربية لضمان عمل الزر ---
  const arToEn = (str) => {
    if (!str) return "";
    return str.toString().replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  };

  const handleProcessEntry = (e) => {
    if(e) e.preventDefault();

    // تحويل المدخلات لأرقام إنجليزية قبل المعالجة
    const cleanBalance = arToEn(newItem.balance);
    const cleanPrice = arToEn(newItem.price);

    if (!newItem.name || !cleanBalance || !cleanPrice) {
      Swal.fire({ title: 'بيانات ناقصة', text: 'يرجى إكمال جميع الحقول', icon: 'warning', confirmButtonText: 'حسناً' });
      return;
    }

    const qty = Number(cleanBalance);
    const cost = Number(cleanPrice);
    const entryDate = new Date().toLocaleString('ar-EG');
    const normalizedNewName = newItem.name.trim();

    const existingItem = categories.find(item => 
      item.name.trim().toLowerCase() === normalizedNewName.toLowerCase()
    );

    if (existingItem) {
      const updatedData = {
        ...existingItem,
        balance: (Number(existingItem.balance) || 0) + qty,
        price: cost, 
      };
      onUpdateItem(updatedData);
    } else {
      const newEntry = {
        id: `item-${Date.now()}`,
        name: normalizedNewName,
        unit: newItem.unit,
        balance: qty,
        price: cost,
        category: normalizedNewName.includes("معمول") || normalizedNewName.includes("جاهز") ? 'finished' : 'raw',
        date: entryDate
      };
      onAddItem(newEntry);
    }

    const logEntry = {
      id: Date.now(),
      date: entryDate,
      name: normalizedNewName,
      quantity: qty,
      price: cost,
      total: qty * cost
    };
    setInventoryLog(prev => [logEntry, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'تمت العملية بنجاح',
      text: `تم تحديث مخزون: ${normalizedNewName}`,
      timer: 1500,
      showConfirmButton: false
    });

    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '', category: 'raw' });
  };

  return (
    <div style={containerStyle}>
      <div style={statsRow}>
        <div style={statCard}>
          <BarChart3 color="#16a34a" size={24} />
          <div>
            <span style={statLabel}>إجمالي قيمة المخزون</span>
            <div style={statValue}>{stats.totalValue.toLocaleString()} ج.م</div>
          </div>
        </div>
        <div style={{ ...statCard, borderRight: '4px solid #ef4444' }}>
          <AlertTriangle color="#ef4444" size={24} />
          <div>
            <span style={statLabel}>أصناف قاربت على النفاذ</span>
            <div style={statValue}>{stats.lowStock} صنف</div>
          </div>
        </div>
      </div>

      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث في المخازن..." 
            style={searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}>
          <Plus size={18} /> توريد خامات
        </button>
      </div>

      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>
          <Package size={16} /> خامات أولية
        </button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>
          <Save size={16} /> منتجات جاهزة
        </button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>
          <History size={16} /> سجل الوارد
        </button>
      </div>

      {activeTab === 'log' ? (
        <div style={tableContainer} className="glass-card">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>الصنف</th>
                <th style={thStyle}>الكمية الموردة</th>
                <th style={thStyle}>سعر الوحدة</th>
                <th style={thStyle}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLog.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>لا يوجد سجلات حتى الآن</td></tr>
              ) : (
                inventoryLog.map(log => (
                  <tr key={log.id} style={trStyle}>
                    <td style={tdStyle}>{log.date}</td>
                    <td style={tdStyle}><strong>{log.name}</strong></td>
                    <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 'bold' }}>+{log.quantity}</td>
                    <td style={tdStyle}>{log.price}</td>
                    <td style={tdStyle}>{log.total.toLocaleString()} ج.م</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.length === 0 ? (
            <div style={{gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#94a3b8'}}>
              لا توجد نتائج مطابقة للبحث أو القسم فارغ
            </div>
          ) : (
            filteredData.map(item => (
              <div key={item.id} style={itemCard} className="glass-card">
                <div style={cardHeader}>
                  <span style={unitTag}>{item.unit}</span>
                  <button onClick={() => onDeleteItem(item.id)} style={deleteBtn}><Trash2 size={16} /></button>
                </div>
                <h3 style={itemTitle}>{item.name}</h3>
                <div style={itemDetails}>
                  <div style={detailBox}>
                    <span style={detailLabel}>الرصيد</span>
                    <span style={{ ...detailValue, color: item.balance < 10 ? '#ef4444' : '#1e293b' }}>
                      {item.balance}
                    </span>
                  </div>
                  <div style={detailBox}>
                    <span style={detailLabel}>سعر الكيلو</span>
                    <span style={detailValue}>{item.price}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div style={overlay}>
          <div style={modal} className="glass-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{margin:0, fontSize:'18px'}}>إضافة / توريد مخزون</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleProcessEntry}>
              <div style={inputGroup}>
                <label style={labelStyle}>اسم الصنف</label>
                <input 
                  list="items-list"
                  style={modalInput} 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  placeholder="ابحث عن صنف أو أضف جديد..."
                  required
                />
                <datalist id="items-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              <div style={row}>
                <div style={inputGroup}>
                  <label style={labelStyle}>الكمية</label>
                  <input type="text" inputMode="numeric" required style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>السعر الحالي</label>
                  <input type="text" inputMode="numeric" required style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                </div>
              </div>

              <div style={modalActions}>
                <button type="submit" style={confirmBtn}>تأكيد عملية التوريد</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={cancelBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- الستايلات ---
const containerStyle = { padding: '20px', direction: 'rtl', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const statsRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' };
const statCard = { background: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRight: '5px solid #16a34a' };
const statLabel = { fontSize: '12px', color: '#64748b', fontWeight: '500' };
const statValue = { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginTop: '4px' };
const headerActions = { display: 'flex', gap: '12px', marginBottom: '20px' };
const searchWrapper = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '0 15px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', padding: '12px', width: '100%', outline: 'none', fontSize: '14px', background: 'transparent' };
const addBtn = { background: '#16a34a', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' };
const tabBar = { display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '14px', marginBottom: '25px' };
const tabBtn = { flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', transition: '0.3s' };
const activeTabBtn = { ...tabBtn, background: '#fff', color: '#16a34a', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' };
const itemCard = { background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', position: 'relative', transition: 'transform 0.2s' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const unitTag = { fontSize: '11px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', color: '#475569', fontWeight: '600' };
const deleteBtn = { border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' };
const itemTitle = { margin: '0 0 15px 0', fontSize: '17px', fontWeight: 'bold', color: '#1e293b' };
const itemDetails = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' };
const detailBox = { textAlign: 'center' };
const detailLabel = { display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' };
const detailValue = { fontSize: '14px', fontWeight: 'bold' };
const tableContainer = { background: '#fff', borderRadius: '16px', padding: '15px', overflowX: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '15px', textAlign: 'right', color: '#64748b', borderBottom: '2px solid #f1f5f9', fontSize: '14px' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tdStyle = { padding: '15px', fontSize: '14px', color: '#334155' };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modal = { background: '#fff', width: '90%', maxWidth: '450px', padding: '30px', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const inputGroup = { marginBottom: '20px', flex: 1 };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', boxSizing: 'border-box' };
const row = { display: 'flex', gap: '15px' };
const modalActions = { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' };
const confirmBtn = { padding: '16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };
const cancelBtn = { padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' };

export default Inventory;
