import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, ArrowRight, Plus, Trash2, Package, Archive, 
  Layers, AlertTriangle, Table, LayoutGrid, 
  TrendingUp, DollarSign, Download, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryERPPro = ({ categories = [], onBack, onUpdateItem, onDeleteItem, onAddNewItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); 
  
  // صمام أمان للتأكد من أن categories دائماً مصفوفة
  const safeCategories = Array.isArray(categories) ? categories : [];

  // 1. تصفية البيانات مع التأكد من وجود الاسم لتجنب أخطاء includes
  const displayData = useMemo(() => {
    return safeCategories.filter(cat => {
      const name = cat.name || "";
      return activeTab === 'raw' 
        ? !name.includes("جاهز") 
        : name.includes("جاهز");
    });
  }, [safeCategories, activeTab]);

  // 2. حساب الإحصائيات مع التأكد من القيم العددية
  const stats = useMemo(() => {
    const totalValue = displayData.reduce((sum, item) => {
      const balance = parseFloat(item.balance) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (balance * price);
    }, 0);

    const lowStock = displayData.filter(item => (parseFloat(item.balance) || 0) < 5 && item.name);
    
    return { 
      totalValue, 
      count: displayData.length, 
      lowStock 
    };
  }, [displayData]);

  const handleQuickAdd = () => {
    const newItem = {
      id: Date.now(),
      name: activeTab === 'finished' ? 'منتج جاهز جديد' : 'مادة خام جديدة',
      unit: 'وحدة',
      balance: 0,
      price: 0
    };
    if (onAddNewItem) onAddNewItem(newItem);
  };

  const exportToExcel = () => {
    if (displayData.length === 0) return alert("لا توجد بيانات لتصديرها");
    const ws = XLSX.utils.json_to_sheet(displayData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(wb, `جرد_${activeTab}.xlsx`);
  };

  const styles = {
    excelHeader: { background: '#1e5631', color: 'white', padding: '12px', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #144024' },
    excelCell: { border: '1px solid #e2e8f0', padding: '0', background: 'white' },
    excelInput: { width: '100%', border: 'none', padding: '12px', outline: 'none', background: 'transparent', fontSize: '0.95rem', textAlign: 'right' },
    tabBtn: (active) => ({
      padding: '12px 30px', borderRadius: '12px 12px 0 0', border: 'none',
      background: active ? '#fff' : 'rgba(255,255,255,0.5)',
      color: active ? '#1e5631' : '#64748b',
      fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
      boxShadow: active ? '0 -4px 10px rgba(0,0,0,0.05)' : 'none',
      borderBottom: active ? '3px solid #1e5631' : 'none'
    })
  };

  return (
    <div style={{ padding: '25px', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e5631 0%, #2d8a4e 100%)', padding: '20px', borderRadius: '15px', color: 'white', boxShadow: '0 4px 15px rgba(30,86,49,0.2)' }}>
          <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>إجمالي قيمة {activeTab === 'raw' ? 'المواد الخام' : 'المنتجات الجاهزة'}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>{stats.totalValue.toLocaleString()} <small style={{fontSize: '0.9rem'}}>ج.م</small></div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', borderRight: '6px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>عدد الأصناف المسجلة</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginTop: '5px' }}>{stats.count} <small style={{fontSize: '0.9rem'}}>صنف</small></div>
        </div>
      </div>

      {/* Alert Bar */}
      {stats.lowStock.length > 0 && (
        <div style={{ background: '#fff1f2', color: '#be123c', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #fecdd3' }}>
          <AlertTriangle size={20} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <marquee scrollamount="5" style={{ fontWeight: '600' }}>
              ⚠️ تنبيه نواقص: {stats.lowStock.map(i => `${i.name} (${i.balance} ${i.unit || ''})`).join('  |  ')}
            </marquee>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-1px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => setActiveTab('raw')} style={styles.tabBtn(activeTab === 'raw')}>
            <Layers size={18} style={{marginLeft: '8px'}} /> مخزن الخام
          </button>
          <button onClick={() => setActiveTab('finished')} style={styles.tabBtn(activeTab === 'finished')}>
            <Archive size={18} style={{marginLeft: '8px'}} /> مخزن الجاهز
          </button>
        </div>
        
        <div style={{ paddingBottom: '12px', display: 'flex', gap: '10px' }}>
          <button onClick={handleQuickAdd} style={{ background: '#1e5631', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', boxShadow: '0 4px 6px rgba(30,86,49,0.2)' }}>
            <Plus size={20}/> إضافة صنف
          </button>
          <button onClick={exportToExcel} title="تصدير إكسيل" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', cursor: 'pointer', color: '#1e5631' }}>
            <Download size={20}/>
          </button>
        </div>
      </div>

      {/* Excel Spreadsheet View */}
      <div style={{ background: 'white', borderRadius: '0 15px 15px 15px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{...styles.excelHeader, width: '30%'}}>اسم الصنف (وصف المنتج)</th>
                <th style={{...styles.excelHeader, width: '15%'}}>الكمية</th>
                <th style={{...styles.excelHeader, width: '15%'}}>الوحدة</th>
                <th style={{...styles.excelHeader, width: '15%'}}>سعر الوحدة</th>
                <th style={{...styles.excelHeader, width: '15%'}}>إجمالي القيمة</th>
                <th style={{...styles.excelHeader, width: '10%', background: '#991b1b'}}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={styles.excelCell}>
                    <input 
                      style={{...styles.excelInput, fontWeight: '600'}} 
                      value={item.name || ""} 
                      onChange={(e) => onUpdateItem({...item, name: e.target.value})} 
                    />
                  </td>
                  <td style={styles.excelCell}>
                    <input 
                      type="number" 
                      style={{...styles.excelInput, color: (item.balance || 0) < 5 ? '#ef4444' : '#1e293b', textAlign: 'center'}} 
                      value={item.balance ?? 0} 
                      onChange={(e) => onUpdateItem({...item, balance: e.target.value})} 
                    />
                  </td>
                  <td style={styles.excelCell}>
                    <input 
                      style={{...styles.excelInput, textAlign: 'center'}} 
                      value={item.unit || ""} 
                      onChange={(e) => onUpdateItem({...item, unit: e.target.value})} 
                    />
                  </td>
                  <td style={styles.excelCell}>
                    <input 
                      type="number" 
                      style={{...styles.excelInput, textAlign: 'center'}} 
                      value={item.price ?? 0} 
                      onChange={(e) => onUpdateItem({...item, price: e.target.value})} 
                    />
                  </td>
                  <td style={{...styles.excelCell, textAlign: 'center', fontWeight: 'bold', color: '#166534', background: '#f8fafc'}}>
                    {((parseFloat(item.balance) || 0) * (parseFloat(item.price) || 0)).toLocaleString()}
                  </td>
                  <td style={{...styles.excelCell, textAlign: 'center'}}>
                    <button 
                      onClick={() => onDeleteItem(item.id)} 
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayData.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#fff' }}>
            <FileSpreadsheet size={48} style={{ marginBottom: '10px', opacity: 0.2 }} />
            <div>لا توجد أصناف في هذا المخزن حالياً</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <ArrowRight size={20} /> العودة للرئيسية
        </button>
        <span>نظام ERP للمخازن v2.0</span>
      </div>
    </div>
  );
};

export default InventoryERPPro;
