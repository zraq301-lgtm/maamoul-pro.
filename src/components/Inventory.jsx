import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, History, Search, X, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem, onInventoryEntry }) => {
  const [activeTab, setActiveTab] = useState('raw'); // التبويب الافتراضي خامات
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // سجل العمليات المحلي (للعرض فقط)
  const [inventoryLog, setInventoryLog] = useState(() => {
    const saved = localStorage.getItem('inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [newItem, setNewItem] = useState({ name: '', unit: 'كيلو', balance: '', price: '' });

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // --- 1. تصفية البيانات (الخامات والمنتجات) ---
  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    return safeCategories.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      
      if (activeTab === 'raw') {
        // الخامات: أي شيء لا يحتوي على كلمات المنتج الجاهز
        return matchesSearch && !name.includes("معمول") && !name.includes("جاهز");
      } else if (activeTab === 'finished') {
        // المنتجات: التي تحتوي على كلمات المنتج الجاهز
        return matchesSearch && (name.includes("معمول") || name.includes("جاهز"));
      }
      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // --- 2. تصدير الإكسيل (للخامات فقط بناءً على طلبك) ---
  const exportRawMaterialsToExcel = () => {
    // تصفية الخامات فقط من القائمة الرئيسية القادمة من App.jsx
    const rawMaterialsOnly = categories.filter(item => {
      const name = item.name?.toLowerCase() || '';
      return !name.includes("معمول") && !name.includes("جاهز");
    });

    if (rawMaterialsOnly.length === 0) {
      Swal.fire('تنبيه', 'لا توجد خامات لتصديرها حالياً', 'info');
      return;
    }

    const dataToExport = rawMaterialsOnly.map(item => ({
      'اسم الخامة': item.name,
      'الرصيد المتوفر': item.balance,
      'الوحدة': item.unit || 'كيلو',
      'سعر الوحدة': item.price,
      'إجمالي القيمة': (Number(item.balance) * Number(item.price)).toFixed(2) + ' ج.م',
      'تاريخ التحديث': new Date().toLocaleDateString('ar-EG')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "خامات المخزن");
    XLSX.writeFile(wb, `شيت_الخامات_${Date.now()}.xlsx`);
  };

  const arToEn = (str) => str.toString().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  // --- 3. معالجة التوريد وإرساله للمحرك ---
  const handleProcessEntry = (e) => {
    e.preventDefault();
    const qty = Number(arToEn(newItem.balance));
    const price = Number(arToEn(newItem.price));

    if (!newItem.name || isNaN(qty) || isNaN(price)) {
      Swal.fire('بيانات ناقصة', 'يرجى التأكد من إدخال الاسم والكمية والسعر بشكل صحيح', 'warning');
      return;
    }

    const entryDate = new Date().toLocaleString('ar-EG');
    
    // إرسال البيانات فوراً إلى App.jsx ليتولى المحرك التحديث المركزي
    const entryPayload = {
      name: newItem.name.trim(),
      quantity: qty,
      price: price,
      unit: newItem.unit,
      date: entryDate
    };

    if (onInventoryEntry) {
      onInventoryEntry(entryPayload); // التحديث في App.jsx
    }

    // تحديث سجل الوارد الظاهر في شاشة المخزن
    setInventoryLog([{ ...entryPayload, id: Date.now() }, ...inventoryLog]);
    
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
    Swal.fire({ icon: 'success', title: 'تم تسجيل التوريد بنجاح', timer: 1500, showConfirmButton: false });
  };

  return (
    <div style={containerStyle}>
      {/* البطاقات العلوية */}
      <div style={statsRow}>
        <button style={excelBtn} onClick={exportRawMaterialsToExcel}>
          <Download size={20} /> تصدير إكسيل (الخامات فقط)
        </button>
      </div>

      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input placeholder="بحث في المخازن..." style={searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}><Plus size={18} /> توريد</button>
      </div>

      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>خامات</button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>منتجات</button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>سجل الوارد</button>
      </div>

      {/* عرض البيانات */}
      {activeTab === 'log' ? (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr style={thRow}><th>التاريخ</th><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>
            </thead>
            <tbody>
              {inventoryLog.map(log => (
                <tr key={log.id} style={trStyle}><td>{log.date}</td><td><b>{log.name}</b></td><td style={{color:'#16a34a'}}>+{log.quantity}</td><td>{log.price}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.length === 0 ? (
            <div style={emptyMsg}>لا توجد خامات مسجلة حالياً</div>
          ) : (
            filteredData.map(item => (
              <div key={item.id} style={itemCard} className="glass-card">
                <div style={{display:'flex', justifyContent:'space-between'}}>
                   <h3 style={itemTitle}>{item.name}</h3>
                   <button onClick={() => onDeleteItem(item.id)} style={deleteBtn}><Trash2 size={14}/></button>
                </div>
                <div style={itemDetails}>
                  <div style={detailBox}><span>الرصيد</span><br/><b>{item.balance}</b></div>
                  <div style={detailBox}><span>السعر</span><br/><b>{item.price}</b></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* مودال التوريد */}
      {isAddModalOpen && (
        <div style={overlay}>
          <div style={modal} className="glass-card">
            <div style={modalHeader}>
              <h3>توريد / إضافة للمخزن</h3>
              <X onClick={() => setIsAddModalOpen(false)} style={{cursor:'pointer'}} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <label style={label}>اسم الخامة / الصنف</label>
              <input list="items-list" style={modalInput} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required placeholder="مثلاً: دقيق، سكر..." />
              <datalist id="items-list">{categories.map(c => <option key={c.id} value={c.name} />)}</datalist>
              
              <div style={row}>
                <div style={{flex:1}}>
                  <label style={label}>الكمية</label>
                  <input type="text" inputMode="numeric" style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} required />
                </div>
                <div style={{flex:1}}>
                  <label style={label}>السعر</label>
                  <input type="text" inputMode="numeric" style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                </div>
              </div>
              <button type="submit" style={confirmBtn}>تأكيد عملية التوريد</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- الستايلات المتوافقة مع الصور ---
const containerStyle = { padding: '15px', direction: 'rtl', backgroundColor: '#f8fafc', minHeight: '100vh' };
const excelBtn = { width: '100%', padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', cursor: 'pointer' };
const headerActions = { display: 'flex', gap: '10px', marginBottom: '15px' };
const searchWrapper = { flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', padding: '0 12px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', padding: '12px', width: '100%', outline: 'none', fontSize: '14px' };
const addBtn = { background: '#16a34a', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' };
const tabBar = { display: 'flex', gap: '8px', background: '#edf2f7', padding: '5px', borderRadius: '12px', marginBottom: '20px' };
const tabBtn = { flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: 'transparent', cursor: 'pointer', color: '#64748b' };
const activeTabBtn = { ...tabBtn, background: '#fff', color: '#16a34a', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' };
const itemCard = { background: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #f1f5f9' };
const itemTitle = { fontSize: '16px', margin: 0, color: '#1e293b' };
const itemDetails = { display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' };
const detailBox = { textAlign: 'center' };
const deleteBtn = { color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' };
const tableContainer = { background: '#fff', borderRadius: '16px', padding: '10px', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRow = { borderBottom: '2px solid #f1f5f9', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modal = { background: '#fff', width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '24px' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', outline: 'none' };
const label = { display: 'block', fontSize: '13px', marginBottom: '8px', color: '#64748b' };
const row = { display: 'flex', gap: '12px' };
const confirmBtn = { width: '100%', padding: '16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' };
const statsRow = { marginBottom: '15px' };
const emptyMsg = { gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' };

export default Inventory;
