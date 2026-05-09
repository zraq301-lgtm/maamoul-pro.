import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Package, AlertTriangle, BarChart3, Save, History, Search, X, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const Inventory = ({ categories = [], onAddItem, onDeleteItem, onUpdateItem, onInventoryEntry }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // سجل العمليات المحلي (اختياري للعرض فقط)
  const [inventoryLog, setInventoryLog] = useState(() => {
    const saved = localStorage.getItem('inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [newItem, setNewItem] = useState({ name: '', unit: 'كيلو', balance: '', price: '' });

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // --- التعديل الجوهري هنا: تحسين الفلترة لتشمل كل البيانات القادمة ---
  const filteredData = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    return safeCategories.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      
      // تحديد التصنيف بناءً على الاسم أو حقل الكاتيجوري إذا وجد
      const isFinished = name.includes("معمول") || name.includes("جاهز") || item.category === 'finished';
      
      if (activeTab === 'raw') return matchesSearch && !isFinished;
      if (activeTab === 'finished') return matchesSearch && isFinished;
      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // تصدير الإكسيل (يعتمد على البيانات الأصلية القادمة من App.jsx لضمان الشمولية)
  const exportToExcel = () => {
    const dataToExport = categories.map(item => ({
      'اسم المادة': item.name,
      'النوع': (item.name.includes("معمول") || item.name.includes("جاهز")) ? 'منتج نهائي' : 'مادة خام',
      'الرصيد الحالي': item.balance,
      'الوحدة': item.unit,
      'سعر الوحدة': item.price,
      'إجمالي القيمة': (Number(item.balance) * Number(item.price)) || 0
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون الكامل");
    XLSX.writeFile(wb, `Inventory_${new Date().getTime()}.xlsx`);
  };

  const arToEn = (str) => str.toString().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  const handleProcessEntry = (e) => {
    e.preventDefault();
    const qty = Number(arToEn(newItem.balance));
    const price = Number(arToEn(newItem.price));

    if (!newItem.name || isNaN(qty)) {
      Swal.fire('خطأ', 'يرجى إدخال اسم الصنف والكمية بشكل صحيح', 'error');
      return;
    }

    const isFinished = newItem.name.includes("معمول") || newItem.name.includes("جاهز");

    const entryPayload = {
      name: newItem.name.trim(),
      quantity: qty,
      price: price || 0,
      unit: newItem.unit,
      category: isFinished ? 'finished' : 'raw',
      date: new Date().toISOString()
    };

    // إرسال للـ App.jsx (المحرك الرئيسي)
    if (onInventoryEntry) {
      onInventoryEntry(entryPayload);
    }

    // تحديث السجل المحلي
    setInventoryLog(prev => [{ id: Date.now(), ...entryPayload, displayDate: new Date().toLocaleString('ar-EG') }, ...prev]);
    
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
    Swal.fire({ icon: 'success', title: 'تم تسجيل التوريد', timer: 1000, showConfirmButton: false });
  };

  return (
    <div style={containerStyle}>
      {/* الإحصائيات وزر الإكسيل */}
      <div style={statsRow}>
         <div style={statCard} onClick={exportToExcel}>
          <Download color="#16a34a" size={24} />
          <div>
            <span style={statLabel}>تحميل شيت الإكسيل (كامل المخزن)</span>
            <div style={{...statValue, fontSize: '13px'}}>يحتوي على {categories.length} صنف</div>
          </div>
        </div>
      </div>

      <div style={headerActions}>
        <div style={searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input placeholder="بحث في الأصناف..." style={searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={addBtn}><Plus size={18} /> توريد جديد </button>
      </div>

      <div style={tabBar}>
        <button onClick={() => setActiveTab('raw')} style={activeTab === 'raw' ? activeTabBtn : tabBtn}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={activeTab === 'finished' ? activeTabBtn : tabBtn}>المنتجات النهائية</button>
        <button onClick={() => setActiveTab('log')} style={activeTab === 'log' ? activeTabBtn : tabBtn}>سجل العمليات</button>
      </div>

      {activeTab === 'log' ? (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr style={{background: '#f1f5f9'}}>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>الصنف</th>
                <th style={thStyle}>الكمية</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLog.map(log => (
                <tr key={log.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={tdStyle}>{log.displayDate || new Date(log.date).toLocaleDateString('ar-EG')}</td>
                  <td style={tdStyle}>{log.name}</td>
                  <td style={{...tdStyle, color: '#16a34a', fontWeight: 'bold'}}>+{log.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={gridContainer}>
          {filteredData.length > 0 ? filteredData.map(item => (
            <div key={item.id} style={itemCard}>
              <h3 style={itemTitle}>{item.name}</h3>
              <div style={itemDetails}>
                <div><small style={{color: '#64748b'}}>الرصيد</small><br/><b style={{color: '#0f172a'}}>{item.balance} {item.unit}</b></div>
                <div><small style={{color: '#64748b'}}>آخر سعر</small><br/><b style={{color: '#16a34a'}}>{item.price}</b></div>
              </div>
              <button onClick={() => onDeleteItem(item.id)} style={deleteBtn}><Trash2 size={14}/></button>
            </div>
          )) : (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
              لا توجد خامات متوفرة حالياً
            </div>
          )}
        </div>
      )}

      {/* مودال التوريد */}
      {isAddModalOpen && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
               <h2 style={{fontSize:'18px'}}>إضافة توريد للمخزن</h2>
               <X onClick={() => setIsAddModalOpen(false)} style={{cursor: 'pointer'}} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <label style={labelStyle}>اسم المادة / المنتج</label>
              <input list="items" placeholder="اختر من القائمة أو اكتب اسماً جديداً" style={modalInput} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <datalist id="items">{categories.map(c => <option key={c.id} value={c.name} />)}</datalist>
              
              <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                <div style={{flex: 1}}>
                  <label style={labelStyle}>الكمية الواردة</label>
                  <input type="text" placeholder="0.00" style={modalInput} value={newItem.balance} onChange={e => setNewItem({...newItem, balance: e.target.value})} required />
                </div>
                <div style={{flex: 1}}>
                  <label style={labelStyle}>سعر الوحدة</label>
                  <input type="text" placeholder="0.00" style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                </div>
              </div>
              
              <button type="submit" style={confirmBtn}>تأكيد دخول المخزن</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ستايلات إضافية لتحسين المظهر
const labelStyle = { display: 'block', fontSize: '12px', marginBottom: '5px', color: '#64748b' };
const thStyle = { padding: '12px', textAlign: 'right', fontSize: '13px', color: '#475569' };
const tdStyle = { padding: '12px', fontSize: '13px' };
// (باقي الستايلات الخاصة بك تبقى كما هي مع التأكد من تعديل الـ gridContainer)
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' };

export default Inventory;
