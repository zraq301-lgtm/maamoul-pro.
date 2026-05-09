import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, Save, History, Search, X
} from 'lucide-react';
import Swal from 'sweetalert2';

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw', 'finished', 'log'
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // سجل العمليات - مخزن محلياً لضمان عدم الضياع
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

  // حفظ السجل تلقائياً
  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // تصفية البيانات - تم تحسين المنطق لضمان ظهور البيانات دائماً
  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    
    let baseList = [];
    if (activeTab === 'raw') {
      // عرض الخامات (الأصناف التي لا تحتوي على كلمة معمول أو جاهز)
      baseList = safeCategories.filter(cat => 
        cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز")
      );
    } else if (activeTab === 'finished') {
      // عرض المنتجات النهائية (معمول / جاهز)
      baseList = safeCategories.filter(cat => 
        cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز"))
      );
    }

    if (searchTerm) {
      baseList = baseList.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return baseList.map(item => ({
      ...item,
      total: (Number(item.balance) || 0) * (Number(item.price) || 0)
    }));
  }, [activeTab, categories, searchTerm]);

  // إحصائيات المخزن
  const stats = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.total, 0);
    const lowStock = filteredData.filter(item => Number(item.balance) < 10).length;
    return { totalValue, lowStock };
  }, [filteredData]);

  // دالة معالجة التوريد (رفع الرصيد أو إضافة صنف)
  const handleProcessEntry = () => {
    const { name, balance, price, unit } = newItem;

    if (!name || !balance || !price) {
      Swal.fire({ title: 'بيانات ناقصة', text: 'يرجى إدخال الاسم والكمية والسعر', icon: 'warning', confirmButtonText: 'حسناً' });
      return;
    }

    const qty = Number(balance);
    const cost = Number(price);
    const entryDate = new Date().toLocaleString('ar-EG');
    const normalizedNewName = name.trim();

    // البحث عن الصنف إذا كان موجوداً مسبقاً لرفع رصيده
    const existingItem = categories.find(item => 
      item.name.trim() === normalizedNewName
    );

    if (existingItem) {
      // تحديث صنف موجود
      const updatedData = {
        ...existingItem,
        balance: (Number(existingItem.balance) || 0) + qty,
        price: cost, // تحديث السعر لآخر سعر توريد
      };
      onUpdateItem(updatedData);
    } else {
      // إضافة صنف جديد
      const newEntry = {
        id: Date.now().toString(),
        name: normalizedNewName,
        unit,
        balance: qty,
        price: cost,
        category: 'raw',
        date: entryDate
      };
      onAddItem(newEntry);
    }

    // إضافة العملية للسجل
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
      title: existingItem ? 'تم تحديث الرصيد' : 'تمت الإضافة',
      text: `${normalizedNewName}: +${qty} ${unit}`,
      timer: 1500,
      showConfirmButton: false
    });

    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '', category: 'raw' });
  };

  return (
    <div style={containerStyle}>
      {/* ملخص المخزن بالهوية البصرية للمشروع */}
      <div style={statsRow}>
        <div style={statCard}>
          <BarChart3 color="#1e5631" size={24} />
          <div>
            <span style={statLabel}>قيمة المخزون ({activeTab === 'raw' ? 'خامات' : 'منتجات'})</span>
            <div style={statValue}>{stats.totalValue.toLocaleString()} ج.م</div>
          </div>
        </div>
        <div style={{ ...statCard, borderRight: '4px solid #ef4444' }}>
          <AlertTriangle color="#ef4444" size={24} />
          <div>
            <span style={statLabel}>نواقص (أقل من 10)</span>
            <div style={statValue}>{stats.lowStock} صنف</div>
          </div>
        </div>
      </div>

      {/* شريط الأدوات */}
      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="ابحث عن صنف..." 
            style={searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}>
          <Plus size={20} /> توريد
        </button>
      </div>

      {/* التبويبات بنمط مودرن */}
      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>
          <Package size={18} /> الخامات
        </button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>
          <Save size={18} /> المنتجات
        </button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>
          <History size={18} /> السجل
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
                <th style={thStyle}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLog.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#94a3b8'}}>لا يوجد عمليات مسجلة</td></tr>
              ) : (
                inventoryLog.map(log => (
                  <tr key={log.id} style={trStyle}>
                    <td style={tdStyle}>{log.date.split(',')[0]}</td>
                    <td style={tdStyle}><strong>{log.name}</strong></td>
                    <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 'bold' }}>+{log.quantity}</td>
                    <td style={tdStyle}>{log.total.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
              <Package size={48} style={{marginBottom: '10px', opacity: 0.5}} />
              <p>لا توجد أصناف في هذا القسم</p>
            </div>
          ) : (
            filteredData.map(item => (
              <div key={item.id} className="glass-card" style={itemCard}>
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
                    <span style={detailLabel}>السعر</span>
                    <span style={detailValue}>{item.price}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* مودال توريد الخامات */}
      {isAddModalOpen && (
        <div style={overlay}>
          <div className="glass-card" style={modal}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
               <h2 style={{fontSize:'18px'}}>توريد مخزون جديد</h2>
               <X onClick={() => setIsAddModalOpen(false)} style={{cursor:'pointer'}} />
            </div>
            
            <div style={inputGroup}>
              <label style={labelStyle}>اسم الصنف</label>
              <input 
                list="items-list"
                style={modalInput} 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="ابحث عن صنف أو أضف جديد..."
              />
              <datalist id="items-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            <div style={row}>
              <div style={inputGroup}>
                <label style={labelStyle}>الكمية</label>
                <input type="number" style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>سعر الوحدة</label>
                <input type="number" style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
            </div>

            <div style={modalActions}>
              <button onClick={handleProcessEntry} style={confirmBtn}>إتمام عملية التوريد</button>
              <button onClick={() => setIsAddModalOpen(false)} style={cancelBtn}>تراجع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- الستايلات الاحترافية المحسنة للموبايل ---
const containerStyle = { padding: '15px', direction: 'rtl', fontFamily: 'system-ui', paddingBottom: '80px' };
const statsRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' };
const statCard = { background: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', borderRight: '4px solid #1e5631' };
const statLabel = { fontSize: '10px', color: '#64748b', display: 'block' };
const statValue = { fontSize: '14px', fontWeight: 'bold', color: '#1e293b' };
const headerActions = { display: 'flex', gap: '8px', marginBottom: '15px' };
const searchWrapper = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '0 10px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', padding: '10px', width: '100%', outline: 'none', fontSize: '14px' };
const addBtn = { background: '#1e5631', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' };
const tabBar = { display: 'flex', gap: '4px', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '15px' };
const tabBtn = { flex: 1, padding: '8px', border: 'none', borderRadius: '10px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#64748b', fontSize: '13px' };
const activeTabBtn = { ...tabBtn, background: '#fff', color: '#1e5631', fontWeight: 'bold' };
const gridContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const itemCard = { background: '#fff', padding: '12px', borderRadius: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' };
const unitTag = { fontSize: '9px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '5px', color: '#64748b' };
const deleteBtn = { border: 'none', background: 'none', color: '#ef4444' };
const itemTitle = { margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#334155' };
const itemDetails = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' };
const detailBox = { textAlign: 'center' };
const detailLabel = { display: 'block', fontSize: '9px', color: '#94a3b8' };
const detailValue = { fontSize: '12px', fontWeight: 'bold' };
const tableContainer = { background: '#fff', borderRadius: '15px', padding: '5px', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '12px' };
const thStyle = { padding: '10px', textAlign: 'right', background: '#f8fafc', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '10px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '15px' };
const modal = { background: '#fff', width: '100%', maxWidth: '380px', padding: '20px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelStyle = { fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '5px', display: 'block' };
const modalInput = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' };
const inputGroup = { marginBottom: '12px' };
const row = { display: 'flex', gap: '10px' };
const modalActions = { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' };
const confirmBtn = { padding: '12px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' };
const cancelBtn = { padding: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px' };

export default Inventory;
