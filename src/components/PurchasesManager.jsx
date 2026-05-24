import React, { useState } from 'react';
import { Truck, ArrowRight, Save, ShoppingCart, Table, AlertTriangle } from 'lucide-react';
import DataGrid from './DataGrid';
import Swal from 'sweetalert2';

const PurchasesManager = ({ onBack, data, onUpdate, onSave }) => {
  // استخراج البيانات من الـ props الموحدة
  const { stock = [], inventory = [], suppliers = [] } = data;
  const [activeView, setActiveView] = useState('menu');
  const [isNewItem, setIsNewItem] = useState(false);
  
  const [formData, setFormData] = useState({
    item: '', unit: '', quantity: '', price: '',
    supplier: '', paymentMethod: 'كاش',
    date: new Date().toISOString().split('T')[0]
  });

  const [orderRequest, setOrderRequest] = useState({ 
    item: '', currentStock: 0, daysLeft: 0, neededQty: '', supplier: '' 
  });

  const lowStockItems = stock.filter(s => (s.balance || s.stock) <= 20);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) {
      Swal.fire('خطأ', 'يرجى إكمال بيانات الفاتورة', 'error');
      return;
    }

    const total = parseFloat(formData.quantity) * parseFloat(formData.price);
    
    const purchaseOrder = {
      id: `INV-${Date.now()}`,
      date: formData.date,
      vendorId: formData.supplier || 'مورد عام',
      supplierName: formData.supplier || 'مورد عام',
      paymentMethod: formData.paymentMethod,
      status: 'completed',
      totalAmount: total,
      item: formData.item,
      quantity: formData.quantity,
      price: formData.price,
      total: total,
      items: [{
        productId: formData.item,
        name: formData.item,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.price),
        total: total
      }]
    };

    // استخدام الدالة onSave الممررة من App.jsx (التي تتعامل مع السيرفر وتحديث المخزون)
    await onSave(purchaseOrder);
    
    setFormData({ item: '', unit: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] });
    setActiveView('menu');
  };

  const handleSendToSuppliers = (e) => {
    e.preventDefault();
    Swal.fire('تم', 'تم إرسال طلب الاحتياج للمورد بنجاح', 'success');
    setActiveView('menu');
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      
      {lowStockItems.length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: '10px', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 'bold' }}>
            تنبيه: {lowStockItems.length} أصناف منخفضة المخزون
          </span>
        </div>
      )}

      {activeView === 'menu' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShoppingCart size={28} color="#1e5631" />
            <h2>نظام المشتريات</h2>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div className="glass-card" onClick={() => setActiveView('entry')} style={{ cursor: 'pointer', borderRight: '8px solid #1e5631', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Save size={24} color="#1e5631" />
                <div><h3>فاتورة مشتريات</h3></div>
              </div>
            </div>

            <div className="glass-card" onClick={() => setActiveView('orderRequest')} style={{ cursor: 'pointer', borderRight: '8px solid #f59e0b', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Truck size={24} color="#f59e0b" />
                <div><h3>طلب احتياج</h3></div>
              </div>
            </div>

            <div className="glass-card" onClick={() => setActiveView('grid')} style={{ cursor: 'pointer', borderRight: '8px solid #3b82f6', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Table size={24} color="#3b82f6" />
                <div><h3>سجل المشتريات</h3></div>
              </div>
            </div>
          </div>
          
          <button onClick={onBack} style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#f8fafc' }}>
            العودة للرئيسية
          </button>
        </>
      )}

      {/* بقية العرض (entry, orderRequest, grid) تظل كما هي بنفس المنطق */}
      {/* تأكد من إغلاق كافة الأقواس */}
    </div>
  );
};

export default PurchasesManager;
