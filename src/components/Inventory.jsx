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

  // 1. تصفية البيانات للعرض (تم التعديل لدعم item و name)
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(categories) ? categories : [];
    return safeData.filter(itemData => {
      // توحيد جلب الاسم من أي مصدر (شراء أو توريد يدوي)
      const displayName = (itemData.name || itemData.item || '').toLowerCase();
      const matchesSearch = displayName.includes(searchTerm.toLowerCase());
      
      // منطق التمييز بين المنتج النهائي والخامات
      const isFinished = displayName.includes("معمول") || 
                         displayName.includes("جاهز") || 
                         itemData.category === 'finished';
      
      if (activeTab === 'raw') return matchesSearch && !isFinished;
      if (activeTab === 'finished') return matchesSearch && isFinished;
      if (activeTab === 'log') return matchesSearch && itemData.batchInfo; // عرض العمليات المسجلة

      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // 2. دالة تصدير الإكسيل
  const exportRawMaterialsToExcel = () => {
    const rawMaterials = categories.filter(item => {
      const name = (item.name || item.item || '').toLowerCase();
      return !(name.includes("معمول") || name.includes("جاهز") || item.category === 'finished');
    });

    if (rawMaterials.length === 0) {
      Swal.fire('تنبيه', 'لا توجد مواد خام لتصديرها حالياً', 'info');
      return;
    }

    const dataToExport = rawMaterials.map(item => ({
      'اسم المادة الخام': item.name || item.item,
      'الرصيد': item.balance || item.quantity,
      'الوحدة': item.unit || 'كيلو',
      'السعر': item.price,
      'إجمالي القيمة': (Number(item.balance || item.quantity) * Number(item.price)).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المواد الخام");
    XLSX.writeFile(wb, `Raw_Materials_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  // 3. دالة معالجة التوريد (المدمجة)
  const handleProcessEntry = (e) => {
    e.preventDefault();
    
    const formData = {
      item: newItem.name.trim(),
      quantity: newItem.balance,
      price: newItem.price,
      unit: newItem.unit,
      date: new Date().toISOString().split('T')[0],
      supplier: 'توريد داخلي'
    };

    try {
      if (!formData.item || !formData.quantity || !formData.price) {
        throw new Error("يرجى إكمال بيانات التوريد");
      }

      const purchaseWithBatch = {
        ...formData,
        name: formData.item, // نرسل الأثنين لضمان التوافق
        balance: parseFloat(formData.quantity),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        total: parseFloat(formData.quantity) * parseFloat(formData.price),
        id: Date.now(),
        type: 'ERP_SUPPLY',
        batchInfo: {
          batchId: `B-${Date.now().toString().slice(-6)}`,
          purchaseDate: formData.date,
          costPerUnit: parseFloat(formData.price),
          supplier: formData.supplier
        }
      };

      if (onInventoryEntry) {
        onInventoryEntry(purchaseWithBatch);
      }

      setIsAddModalOpen(false);
      setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
      
      Swal.fire({ 
        icon: 'success', 
        title: 'تمت عملية التوريد', 
        text: `رقم الشحنة: ${purchaseWithBatch.batchInfo.batchId}`,
        timer: 2000, 
        showConfirmButton: false 
      });

    } catch (error) {
      Swal.fire('خطأ', error.message, 'error');
    }
  };

  const styles = {
    container: { padding: '15px', direction: 'rtl', backgroundColor: '#f0f4f8', minHeight: '100vh' },
    exportCard: { background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'pointer' },
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
      <div style={styles.exportCard} onClick={exportRawMaterialsToExcel}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <div style={{textAlign: 'right'}}>
              <h2 style={{margin: 0, fontSize: '22px'}}>تصدير إكسيل</h2>
              <p style={{color: '#64748b', margin: '5px 0 0 0'}}>تحميل بيانات المواد الخام</p>
           </div>
           <Download color="#22c55e" size={32} />
        </div>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} /> توريد
        </button>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث..." 
            style={{border: 'none', outline: 'none', padding: '10px', width: '100%'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.tabContainer}>
        <div style={{...styles.tab, ...(activeTab === 'log' ? styles.activeTab : {})}} onClick={() => setActiveTab('log')}>سجل الوارد</div>
        <div style={{...styles.tab, ...(activeTab === 'finished' ? styles.activeTab : {})}} onClick={() => setActiveTab('finished')}>منتجات</div>
        <div style={{...styles.tab, ...(activeTab === 'raw' ? styles.activeTab : {})}} onClick={() => setActiveTab('raw')}>خامات</div>
      </div>

      <div>
        {filteredData.map(item => (
          <div key={item.id} style={styles.itemCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              {/* عرض الاسم سواء كان مفتاحه item أو name */}
              <h3 style={{margin: 0}}>{item.name || item.item}</h3>
              <Trash2 size={18} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => onDeleteItem(item.id)} />
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', color: '#475569'}}>
              {/* عرض الرصيد سواء كان مفتاحه balance أو quantity */}
              <span>الرصيد: <b>{item.balance || item.quantity}</b></span>
              <span>السعر: <b>{item.price}</b></span>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '25px', padding: '25px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
              <h3>إضافة توريد جديد</h3>
              <X onClick={() => setIsAddModalOpen(false)} style={{cursor:'pointer'}} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <input 
                placeholder="اسم الصنف" 
                style={{width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '10px'}}
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                list="prev-items"
                required
              />
              <datalist id="prev-items">
                {categories.map(c => <option key={c.id} value={c.name || c.item} />)}
              </datalist>
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <input 
                  placeholder="الكمية" 
                  type="number"
                  style={{flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd'}}
                  value={newItem.balance}
                  onChange={e => setNewItem({...newItem, balance: e.target.value})}
                  required
                />
                <input 
                  placeholder="السعر" 
                  type="number"
                  style={{flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd'}}
                  value={newItem.price}
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                  required
                />
              </div>
              <button type="submit" style={{...styles.addBtn, width: '100%', padding: '15px'}}>تأكيد التوريد</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
