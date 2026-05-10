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

  // 1. تصفية البيانات للعرض
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(categories) ? categories : [];
    return safeData.filter(itemData => {
      const displayName = (itemData.name || itemData.item || '').toLowerCase();
      const matchesSearch = displayName.includes(searchTerm.toLowerCase());
      
      // منطق التمييز المحسن
      const isFinished = displayName.includes("معمول") || 
                         displayName.includes("جاهز") || 
                         itemData.category === 'finished';
      
      if (activeTab === 'raw') return matchesSearch && !isFinished;
      if (activeTab === 'finished') return matchesSearch && isFinished;
      if (activeTab === 'log') return matchesSearch && itemData.batchInfo;

      return false;
    });
  }, [activeTab, categories, searchTerm]);

  // 2. دالة التوريد المعدلة لضمان الإضافة الفورية
  const handleProcessEntry = (e) => {
    e.preventDefault();
    
    const itemName = newItem.name.trim();
    const isFinishedProduct = itemName.includes("معمول") || itemName.includes("جاهز");

    const purchaseData = {
      id: Date.now(),
      name: itemName,
      item: itemName,
      balance: parseFloat(newItem.balance),
      quantity: parseFloat(newItem.balance),
      price: parseFloat(newItem.price),
      unit: newItem.unit,
      category: isFinishedProduct ? 'finished' : 'raw', // تحديد الفئة فوراً
      date: new Date().toISOString().split('T')[0],
      type: 'INVENTORY_IN',
      batchInfo: {
        batchId: `B-${Date.now().toString().slice(-5)}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        costPerUnit: parseFloat(newItem.price),
        supplier: 'توريد مباشر'
      }
    };

    try {
      if (!purchaseData.name || !purchaseData.quantity || !purchaseData.price) {
        throw new Error("يرجى إكمال البيانات");
      }

      // إرسال البيانات للأب
      if (onInventoryEntry) {
        onInventoryEntry(purchaseData);
      }

      // إغلاق المودال وتصفير الحقول
      setIsAddModalOpen(false);
      setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
      
      Swal.fire({ 
        icon: 'success', 
        title: 'تم الإضافة للمخزن', 
        text: `تم تسجيل ${itemName} بنجاح`,
        timer: 1500, 
        showConfirmButton: false 
      });

    } catch (error) {
      Swal.fire('خطأ', error.message, 'error');
    }
  };

  // 3. دالة تصدير الإكسيل
  const exportRawMaterialsToExcel = () => {
    const rawMaterials = categories.filter(item => {
      const name = (item.name || item.item || '').toLowerCase();
      return !(name.includes("معمول") || name.includes("جاهز") || item.category === 'finished');
    });

    if (rawMaterials.length === 0) {
      Swal.fire('تنبيه', 'لا توجد مواد خام لتصديرها', 'info');
      return;
    }

    const dataToExport = rawMaterials.map(item => ({
      'اسم الصنف': item.name || item.item,
      'الرصيد': item.balance || item.quantity,
      'الوحدة': item.unit || 'كيلو',
      'السعر': item.price,
      'القيمة الإجمالية': (Number(item.balance || item.quantity) * Number(item.price)).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزن");
    XLSX.writeFile(wb, `Inventory_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  const styles = {
    container: { padding: '15px', direction: 'rtl', backgroundColor: '#f0f4f8', minHeight: '100vh' },
    exportCard: { background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'pointer' },
    actionRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    addBtn: { background: '#22c55e', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    searchBox: { flex: 2, background: '#fff', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 15px', border: '1px solid #e2e8f0' },
    tabContainer: { display: 'flex', background: '#e2e8f0', borderRadius: '20px', padding: '5px', marginBottom: '20px' },
    tab: { flex: 1, padding: '15px', textAlign: 'center', borderRadius: '15px', cursor: 'pointer', transition: '0.3s', fontWeight: 'bold', color: '#64748b' },
    activeTab: { background: '#fff', color: '#22c55e' },
    itemCard: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.exportCard} onClick={exportRawMaterialsToExcel}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <div style={{textAlign: 'right'}}>
              <h2 style={{margin: 0, fontSize: '20px'}}>تقرير المخزن الحالي</h2>
              <p style={{color: '#64748b', margin: '5px 0 0 0'}}>تحميل الملف بصيغة Excel</p>
           </div>
           <Download color="#22c55e" size={28} />
        </div>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} /> توريد جديد
        </button>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث في الأصناف..." 
            style={{border: 'none', outline: 'none', padding: '10px', width: '100%', background: 'transparent'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.tabContainer}>
        <div style={{...styles.tab, ...(activeTab === 'log' ? styles.activeTab : {})}} onClick={() => setActiveTab('log')}>سجل العمليات</div>
        <div style={{...styles.tab, ...(activeTab === 'finished' ? styles.activeTab : {})}} onClick={() => setActiveTab('finished')}>المنتجات</div>
        <div style={{...styles.tab, ...(activeTab === 'raw' ? styles.activeTab : {})}} onClick={() => setActiveTab('raw')}>الخامات</div>
      </div>

      <div style={{paddingBottom: '80px'}}>
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <div key={item.id} style={styles.itemCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <h3 style={{margin: 0, color: '#1e293b'}}>{item.name || item.item}</h3>
                <Trash2 size={18} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => onDeleteItem(item.id)} />
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', color: '#475569'}}>
                <span>الكمية: <b style={{color: '#22c55e'}}>{item.balance || item.quantity}</b> {item.unit}</span>
                <span>السعر: <b>{item.price}</b></span>
              </div>
            </div>
          ))
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>لا توجد بيانات لعرضها هنا</div>
        )}
      </div>

      {isAddModalOpen && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'}}>
          <div style={{background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '25px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>توريد صنف للمخزن</h3>
              <X onClick={() => setIsAddModalOpen(false)} style={{cursor:'pointer', color: '#64748b'}} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b'}}>اسم الصنف</label>
                <input 
                  placeholder="مثال: دقيق، معمول فستق..." 
                  style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none'}}
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  list="inventory-suggestions"
                  required
                />
                <datalist id="inventory-suggestions">
                  {categories.map((c, i) => <option key={i} value={c.name || c.item} />)}
                </datalist>
              </div>
              
              <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b'}}>الكمية</label>
                  <input 
                    type="number" step="any"
                    style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0'}}
                    value={newItem.balance}
                    onChange={e => setNewItem({...newItem, balance: e.target.value})}
                    required
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b'}}>سعر الوحدة</label>
                  <input 
                    type="number" step="any"
                    style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0'}}
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <button type="submit" style={{...styles.addBtn, width: '100%', padding: '15px', borderRadius: '15px', fontSize: '16px'}}>
                تأكيد الإضافة للمخزن
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
