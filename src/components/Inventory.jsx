import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, Save, History, Search, X, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'; // تأكد من تثبيت المكتبة: npm install xlsx

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem, onInventoryEntry }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [inventoryLog, setInventoryLog] = useState(() => {
    const saved = localStorage.getItem('inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [newItem, setNewItem] = useState({ name: '', unit: 'كيلو', balance: '', price: '' });

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // تصفية البيانات للعرض
  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    return safeCategories.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const matches = name.includes(searchTerm.toLowerCase());
      if (activeTab === 'raw') return matches && !name.includes("معمول") && !name.includes("جاهز");
      if (activeTab === 'finished') return matches && (name.includes("معمول") || name.includes("جاهز"));
      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // دالة تصدير الإكسيل الاحترافية
  const exportToExcel = () => {
    const dataToExport = categories.map(item => ({
      'اسم المادة': item.name,
      'النوع': (item.name.includes("معمول") || item.name.includes("جاهز")) ? 'منتج نهائي' : 'مادة خام',
      'الرصيد الحالي': item.balance,
      'الوحدة': item.unit,
      'سعر الوحدة': item.price,
      'إجمالي القيمة': (item.balance * item.price) + ' ج.م'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(wb, `مخزن_معمول_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  const arToEn = (str) => str.toString().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  const handleProcessEntry = (e) => {
    e.preventDefault();
    const qty = Number(arToEn(newItem.balance));
    const price = Number(arToEn(newItem.price));

    if (!newItem.name || isNaN(qty) || isNaN(price)) {
      Swal.fire('خطأ', 'يرجى إدخال بيانات صحيحة', 'error');
      return;
    }

    // إرسال البيانات للمحرك (App.jsx)
    const entryPayload = {
      name: newItem.name.trim(),
      quantity: qty,
      price: price,
      unit: newItem.unit,
      category: (newItem.name.includes("معمول") || newItem.name.includes("جاهز")) ? 'finished' : 'raw'
    };

    if (onInventoryEntry) {
      onInventoryEntry(entryPayload); // النداء للمحرك الأساسي
    }

    // تحديث السجل المحلي للنشاط
    setInventoryLog([{ id: Date.now(), ...entryPayload, date: new Date().toLocaleString('ar-EG') }, ...inventoryLog]);
    
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
    Swal.fire({ icon: 'success', title: 'تم التوريد بنجاح', timer: 1000, showConfirmButton: false });
  };

  return (
    <div style={containerStyle}>
      {/* قسم الإحصائيات */}
      <div style={statsRow}>
         <div style={statCard} onClick={exportToExcel}>
          <Download color="#1e293b" size={24} />
          <div>
            <span style={statLabel}>تصدير شيت إكسيل</span>
            <div style={{...statValue, fontSize: '14px'}}>تحميل البيانات الحالية</div>
          </div>
        </div>
      </div>

      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input placeholder="بحث في المخازن..." style={searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}><Plus size={18} /> توريد </button>
      </div>

      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>خامات</button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>منتجات</button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>سجل الوارد</button>
      </div>

      {activeTab === 'log' ? (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>
            </thead>
            <tbody>
              {inventoryLog.map(log => (
                <tr key={log.id}><td>{log.date}</td><td>{log.name}</td><td>{log.quantity}</td><td>{log.price}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.map(item => (
            <div key={item.id} style={itemCard} className="glass-card">
              <h3 style={itemTitle}>{item.name}</h3>
              <div style={itemDetails}>
                <div><small>الرصيد</small><br/><b>{item.balance}</b></div>
                <div><small>السعر</small><br/><b>{item.price}</b></div>
              </div>
              <button onClick={() => onDeleteItem(item.id)} style={deleteBtn}><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      )}

      {/* مودال الإضافة */}
      {isAddModalOpen && (
        <div style={overlay}>
          <div style={modal} className="glass-card">
            <h2 style={{fontSize:'18px', marginBottom:'20px'}}>إجراء عملية توريد</h2>
            <form onSubmit={handleProcessEntry}>
              <input list="items" placeholder="اسم الصنف" style={modalInput} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <datalist id="items">{categories.map(c => <option key={c.id} value={c.name} />)}</datalist>
              <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                <input type="text" placeholder="الكمية" style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} required />
                <input type="text" placeholder="السعر" style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
              </div>
              <button type="submit" style={confirmBtn}>تأكيد العملية</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={cancelBtn}>إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// الستايلات المختصرة
const containerStyle = { padding: '20px', direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' };
const statsRow = { display: 'grid', gridTemplateColumns: '1fr', marginBottom: '20px' };
const statCard = { background: '#fff', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', border: '1px solid #e2e8f0' };
const statLabel = { fontSize: '12px', color: '#64748b' };
const statValue = { fontWeight: 'bold', color: '#1e293b' };
const headerActions = { display: 'flex', gap: '10px', marginBottom: '20px' };
const searchWrapper = { flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '0 10px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', padding: '10px', width: '100%', outline: 'none' };
const addBtn = { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' };
const tabBar = { display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '10px', marginBottom: '20px' };
const tabBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer' };
const activeTabBtn = { ...tabBtn, background: '#fff', color: '#16a34a', fontWeight: 'bold' };
const gridContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const itemCard = { background: '#fff', padding: '15px', borderRadius: '15px', position: 'relative' };
const itemTitle = { fontSize: '15px', margin: '0 0 10px 0' };
const itemDetails = { display: 'flex', justifyContent: 'space-between', textAlign: 'center' };
const deleteBtn = { position: 'absolute', top: '10px', left: '10px', color: '#ef4444', border: 'none', background: 'none' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: '#fff', width: '90%', padding: '20px', borderRadius: '20px' };
const modalInput = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' };
const confirmBtn = { width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' };
const cancelBtn = { width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', marginTop: '5px' };
const tableContainer = { background: '#fff', borderRadius: '10px', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };

export default Inventory;
