import React, { useState } from 'react';
import { Package, Truck, Archive } from 'lucide-react';

// تصحيح حالة الأحرف إلى Page بحرف كبير لتتوافق مع السيرفر وهيكلة ملفاتك
import RawMaterials from './Page/RawMaterials';
import SupplyEntry from './Page/SupplyEntry';
import FinishedProducts from './Page/FinishedProducts';

// تم إضافة استقبال onSave و onAddItem لضمان الربط المباشر والصحيح مع دالة الحفظ بالأب
const Inventory = ({ 
  stock = [], 
  onDeleteItem, 
  onInventoryEntry, 
  onSaveFinishedProduct, 
  onSave, 
  onAddItem 
}) => {
  const [activeTab, setActiveTab] = useState('raw');

  // ضمان أننا نتعامل مع مصفوفة دائماً لتجنب أي توقف في التطبيق
  const dataList = Array.isArray(stock) ? stock : [];

  // دالة ذكية لتحديد محرك الحفظ القادم من الأب وتجنب خطأ "غير معرفة"
  const handleSupplySave = onInventoryEntry || onSave || onAddItem;

  const styles = {
    container: { padding: '15px', direction: 'rtl', backgroundColor: '#f0f4f8', minHeight: '100vh' },
    tabContainer: { 
      display: 'flex', background: '#fff', borderRadius: '20px', padding: '8px', 
      marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      position: 'sticky', top: '10px', zIndex: 10
    },
    tab: { 
      flex: 1, padding: '12px', textAlign: 'center', borderRadius: '15px', 
      cursor: 'pointer', transition: '0.3s', fontWeight: 'bold', color: '#64748b',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
    },
    activeTab: { background: '#22c55e', color: '#fff' },
    contentArea: { marginTop: '10px' }
  };

  return (
    <div style={styles.container}>
      {/* شريط التنقل العلوي - التبديل بين الخامات، التوريد، والمنتجات */}
      <div style={styles.tabContainer}>
        <div 
          style={{...styles.tab, ...(activeTab === 'raw' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('raw')}
        >
          <Archive size={18} /> الخامات
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'supply' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('supply')}
        >
          <Truck size={18} /> توريد
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'finished' ? styles.activeTab : {})}} 
          onClick={() => setActiveTab('finished')}
        >
          <Package size={18} /> منتجات
        </div>
      </div>

      <div style={styles.contentArea}>
        {/* 1. واجهة الخامات - تمرير بيانات المخزن ودالة الحذف */}
        {activeTab === 'raw' && (
          <RawMaterials 
            categories={dataList} 
            onDeleteItem={onDeleteItem} 
          />
        )}

        {/* 2. واجهة تسجيل التوريد - تمرير دالة الحفظ المضمونة والمربوطة بالأب مباشرة */}
        {activeTab === 'supply' && (
          <SupplyEntry 
            onInventoryEntry={handleSupplySave} 
            categories={dataList} 
          />
        )}

        {/* 3. واجهة المنتجات النهائية - تم تمرير دالة الحفظ المخصصة للمنتج النهائي الجديد هنا */}
        {activeTab === 'finished' && (
          <FinishedProducts 
            categories={dataList} 
            onDeleteItem={onDeleteItem} 
            onSaveFinishedProduct={onSaveFinishedProduct} 
          />
        )}
      </div>
    </div>
  );
};

export default Inventory;
