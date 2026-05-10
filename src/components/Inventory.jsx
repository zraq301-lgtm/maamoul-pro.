import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Search, X, Download 
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const Inventory = ({ categories = [], onDeleteItem, onInventoryEntry }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', unit: 'كيلو', balance: '', price: '' });

  // 1. تصفية البيانات للعرض بناءً على التبويب المختار
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(categories) ? categories : [];
    return safeData.filter(item => {
      const name = (item.name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      
      // منطق ذكي: هل هو منتج نهائي أم مادة خام؟
      const isFinished = name.includes("معمول") || name.includes("جاهز") || item.category === 'finished';
      
      if (activeTab === 'raw') return matchesSearch && !isFinished;
      if (activeTab === 'finished') return matchesSearch && isFinished;
      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // 2. دالة تصدير الإكسيل (تعرض فقط المواد الخام الحالية بناءً على طلبك)
  const exportRawMaterialsToExcel = () => {
    // تصفية المواد الخام فقط من كل البيانات
    const rawMaterials = categories.filter(item => {
      const name = (item.name || '').toLowerCase();
      return !(name.includes("معمول") || name.includes("جاهز") || item.category === 'finished');
    });

    if (rawMaterials.length === 0) {
      Swal.fire('تنبيه', 'لا توجد مواد خام لتصديرها حالياً', 'info');
      return;
    }

    const dataToExport = rawMaterials.map(item => ({
      'اسم المادة الخام': item.name,
      'الرصيد': item.balance,
      'الوحدة': item.unit || 'كيلو',
      'السعر': item.price,
      'إجمالي القيمة': (Number(item.balance) * Number(item.price)).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المواد الخام");
    XLSX.writeFile(wb, `Raw_Materials_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  // 3. التعامل مع التوريد وإرساله لـ App.jsx
  const handleProcessEntry = (e) => {
    e.preventDefault();
    
    if (!newItem.name || !newItem.balance) {
      Swal.fire('خطأ', 'يرجى إدخال الاسم والكمية', 'error');
      return;
    }

    const entryData = {
      name: newItem.name.trim(),
      quantity: Number(newItem.balance),
      price: Number(newItem.price) || 0,
      unit: newItem.unit,
      type: 'supply', // تحديد أنها عملية توريد
      date: new Date().toISOString()
    };

    // إرسال البيانات للأب App.jsx
    if (onInventoryEntry) {
      onInventoryEntry(entryData);
    }

    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
    Swal.fire({ icon: 'success', title: 'تم إرسال البيانات للمخزن', timer: 1000, showConfirmButton: false });
  };

  // --- الستايلات (مطابقة للصورة المرفقة) ---
  const styles = {
    container: { padding: '15px', direction: 'rtl', backgroundColor: '#f0f4f8', minHeight: '100vh' },
    exportCard: { 
      background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center',
      marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'pointer' 
    },
    actionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    addBtn: { background: '#22c55e', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    searchBox: { flex: 2, background: '#fff', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 15px', border: '1px solid #e2e8f0' },
    tabContainer: { display: 'flex', background: '#e2e8f0', borderRadius: '20px', padding: '5px', marginBottom: '20px' },
    tab: { flex: 1, padding: '15px', textAlign: 'center', borderRadius: '15px', cursor: 'pointer', transition: '0.3s', fontWeight: 'bold' },
    activeTab: { background: '#fff', color: '#22c55e' },
    itemCard: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '15px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
  };

  return (
    <div style={styles.container}>
      {/* قسم التصدير */}
      <div style={styles.exportCard} onClick={exportRawMaterialsToExcel}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <div style={{textAlign: 'right'}}>
              <h2 style={{margin: 0, fontSize: '22px'}}>تصدير إكسيل</h2>
              <p style={{color: '#64748b', margin: '5px 0 0 0'}}>تحميل كافة بيانات المواد الخام</p>
           </div>
           <Download color="#22c55e" size={32} />
        </div>
      </div>

      {/* البحث والتوريد */}
      <div style={styles.actionRow}>
        <button style={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} /> توريد
        </button>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث في المخازن..." 
            style={{border: 'none', outline: 'none', padding: '10px', width: '100%'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* التبويبات */}
      <div style={styles.tabContainer}>
        <div 
          style={{...styles.tab, ...(activeTab === 'log' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('log')}
        >سجل الوارد</div>
        <div 
          style={{...styles.tab, ...(activeTab === 'finished' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('finished')}
        >منتجات</div>
        <div 
          style={{...styles.tab, ...(activeTab === 'raw' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('raw')}
        >خامات</div>
      </div>

      {/* قائمة المنتجات */}
      <div style={{paddingBottom: '80px'}}>
        {filteredData.map(item => (
          <div key={item.id} style={styles.itemCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <h3 style={{margin: 0}}>{item.name}</h3>
              <Trash2 size={18} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => onDeleteItem(item.id)} />
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', color: '#475569'}}>
              <span>الرصيد: <b>{item.balance}</b></span>
              <span>السعر: <b>{item.price}</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التوريد */}
      {isAddModalOpen && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: '#fff', width: '90%', borderRadius: '25px', padding: '25px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h3>إجراء عملية توريد</h3>
              <X onClick={() => setIsAddModalOpen(false)} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <input 
                placeholder="اسم الصنف (مادة خام أو منتج)" 
                style={{width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '10px'}}
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                list="prev-items"
              />
              <datalist id="prev-items">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              
              <div style={{display: 'flex', gap: '10px'}}>
                <input 
                  placeholder="الكمية" 
                  type="number"
                  style={{flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd'}}
                  value={newItem.balance}
                  onChange={e => setNewItem({...newItem, balance: e.target.value})}
                />
                <input 
                  placeholder="السعر" 
                  type="number"
                  style={{flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd'}}
                  value={newItem.price}
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
              </div>
              <button type="submit" style={{...styles.addBtn, width: '100%', marginTop: '20px', padding: '15px'}}>تأكيد التوريد</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
