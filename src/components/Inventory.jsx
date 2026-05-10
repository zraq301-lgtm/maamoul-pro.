import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Search, X, Download, Package, History 
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const Inventory = ({ categories = [], onDeleteItem, onInventoryEntry }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // سجل العمليات المحلي
  const [inventoryLog, setInventoryLog] = useState(() => {
    try {
      const saved = localStorage.getItem('inventory_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [newItem, setNewItem] = useState({ name: '', unit: 'كيلو', balance: '', price: '' });

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(inventoryLog));
  }, [inventoryLog]);

  // منطق الفلترة الاحترافي
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(categories) ? categories : [];
    return safeData.filter(item => {
      const name = (item.name || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      const matchesSearch = name.includes(query);
      
      const isFinished = name.includes("معمول") || name.includes("جاهز") || item.category === 'finished';
      
      if (activeTab === 'raw') return matchesSearch && !isFinished;
      if (activeTab === 'finished') return matchesSearch && isFinished;
      return false;
    });
  }, [activeTab, categories, searchTerm]);

  const exportToExcel = () => {
    const dataToExport = categories.map(item => ({
      'الصنف': item.name,
      'النوع': (item.name.includes("معمول") || item.name.includes("جاهز")) ? 'منتج نهائي' : 'مادة خام',
      'الرصيد الحالي': item.balance,
      'آخر سعر': item.price,
      'القيمة الإجمالية': (Number(item.balance) * Number(item.price)).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزن");
    XLSX.writeFile(wb, `Inventory_Report.xlsx`);
  };

  const handleProcessEntry = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.balance) {
      Swal.fire('تنبيه', 'برجاء إكمال البيانات الأساسية', 'warning');
      return;
    }

    const payload = {
      id: Date.now(),
      name: newItem.name.trim(),
      quantity: Number(newItem.balance),
      price: Number(newItem.price) || 0,
      unit: newItem.unit,
      date: new Date().toISOString()
    };

    if (onInventoryEntry) onInventoryEntry(payload);

    setInventoryLog(prev => [{ ...payload, displayDate: new Date().toLocaleString('ar-EG') }, ...prev]);
    setIsAddModalOpen(false);
    setNewItem({ name: '', unit: 'كيلو', balance: '', price: '' });
    Swal.fire({ icon: 'success', title: 'تم التوريد', timer: 1000, showConfirmButton: false });
  };

  // --- كائن الستايلات لضمان عدم حدوث خطأ الصفحة البيضاء ---
  const styles = {
    container: { padding: '20px', direction: 'rtl', fontFamily: 'Arial, sans-serif' },
    statsRow: { marginBottom: '20px' },
    statCard: { 
      background: '#fff', padding: '15px', borderRadius: '12px', 
      display: 'flex', alignItems: 'center', gap: '15px', 
      cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
    },
    headerActions: { display: 'flex', gap: '10px', marginBottom: '20px' },
    searchWrapper: { 
      flex: 1, display: 'flex', alignItems: 'center', background: '#fff', 
      borderRadius: '10px', padding: '0 10px', border: '1px solid #e2e8f0' 
    },
    searchInput: { border: 'none', padding: '10px', width: '100%', outline: 'none' },
    addBtn: { 
      background: '#16a34a', color: '#fff', border: 'none', 
      padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' 
    },
    tabBar: { display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '10px', marginBottom: '20px' },
    tabBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.3s' },
    activeTabBtn: { background: '#fff', color: '#16a34a', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    card: { background: '#fff', padding: '15px', borderRadius: '15px', position: 'relative', border: '1px solid #eee' },
    deleteBtn: { position: 'absolute', top: '10px', left: '10px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', width: '90%', maxWidth: '400px', padding: '25px', borderRadius: '20px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', marginTop: '5px' }
  };

  return (
    <div style={styles.container}>
      {/* تصدير البيانات */}
      <div style={styles.statsRow}>
        <div style={styles.statCard} onClick={exportToExcel}>
          <Download color="#16a34a" />
          <div>
            <div style={{fontWeight: 'bold'}}>تصدير إكسيل</div>
            <small style={{color: '#64748b'}}>تحميل كافة بيانات المخزن الحالي</small>
          </div>
        </div>
      </div>

      <div style={styles.headerActions}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="بحث في المخازن..." 
            style={styles.searchInput} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <button onClick={() => setIsAddModalOpen(true)} style={styles.addBtn}><Plus size={18} /> توريد</button>
      </div>

      {/* التبويبات */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('raw')} 
          style={{...styles.tabBtn, ...(activeTab === 'raw' ? styles.activeTabBtn : {})}}
        >خامات</button>
        <button 
          onClick={() => setActiveTab('finished')} 
          style={{...styles.tabBtn, ...(activeTab === 'finished' ? styles.activeTabBtn : {})}}
        >منتجات</button>
        <button 
          onClick={() => setActiveTab('log')} 
          style={{...styles.tabBtn, ...(activeTab === 'log' ? styles.activeTabBtn : {})}}
        >سجل الوارد</button>
      </div>

      {/* عرض المحتوى */}
      {activeTab === 'log' ? (
        <div style={{overflowX: 'auto', background: '#fff', borderRadius: '10px'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: '#f8fafc'}}>
              <tr>
                <th style={{padding: '12px', textAlign: 'right'}}>التاريخ</th>
                <th style={{padding: '12px', textAlign: 'right'}}>الصنف</th>
                <th style={{padding: '12px', textAlign: 'right'}}>الكمية</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLog.map(log => (
                <tr key={log.id} style={{borderTop: '1px solid #eee'}}>
                  <td style={{padding: '12px'}}>{log.displayDate}</td>
                  <td style={{padding: '12px'}}>{log.name}</td>
                  <td style={{padding: '12px', color: '#16a34a'}}>+{log.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredData.map(item => (
            <div key={item.id} style={styles.card}>
              <h4 style={{margin: '0 0 10px 0'}}>{item.name}</h4>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                <span>الرصيد: <b>{item.balance}</b></span>
                <span>السعر: <b style={{color: '#16a34a'}}>{item.price}</b></span>
              </div>
              <button onClick={() => onDeleteItem(item.id)} style={styles.deleteBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {/* مودال التوريد */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <h3>تسجيل عملية توريد</h3>
              <X style={{cursor: 'pointer'}} onClick={() => setIsAddModalOpen(false)} />
            </div>
            <form onSubmit={handleProcessEntry}>
              <label style={{fontSize: '13px'}}>اسم الصنف</label>
              <input 
                list="items-list"
                style={styles.input} 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})} 
                placeholder="ابحث أو أضف جديداً..."
                required
              />
              <datalist id="items-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>

              <div style={{display: 'flex', gap: '10px'}}>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '13px'}}>الكمية</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={newItem.balance} 
                    onChange={e => setNewItem({...newItem, balance: e.target.value})} 
                    required
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '13px'}}>السعر</label>
                  <input 
                    type="number" 
                    style={styles.input} 
                    value={newItem.price} 
                    onChange={e => setNewItem({...newItem, price: e.target.value})} 
                  />
                </div>
              </div>
              <button type="submit" style={{...styles.addBtn, width: '100%', justifyContent: 'center', marginTop: '10px'}}>تأكيد العملية</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
