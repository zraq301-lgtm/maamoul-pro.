import React, { useState } from 'react';
import { Package, Truck, Calendar, Hash, DollarSign, ArrowRight, Save, ShoppingCart, Bell, Table, AlertTriangle, User } from 'lucide-react';
import DataGrid from './DataGrid';

const PurchasesManager = ({ onPurchaseComplete, onBack, stock = [], onOrderTrigger, inventory = [], suppliers = [] }) => {
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

  const handleExistingItemSelect = (itemName) => {
    if (itemName === "NEW_ITEM") {
      setIsNewItem(true);
      setFormData({ ...formData, item: '', unit: '', price: '' });
      return;
    }
    const selected = stock.find(s => s.name === itemName);
    if (selected) {
      setFormData({
        ...formData,
        item: selected.name,
        unit: selected.unit || '',
        price: selected.price || ''
      });
      setIsNewItem(false);
    }
  };

  const handleItemSelectForOrder = (itemName) => {
    const itemInStock = stock.find(s => s.name === itemName);
    const balance = itemInStock ? (itemInStock.balance || itemInStock.stock) : 0;
    setOrderRequest({
      ...orderRequest,
      item: itemName,
      currentStock: balance,
      daysLeft: Math.floor(balance / 2)
    });
  };

  // --- دالة إرسال طلب الاحتياج (المتوافقة مع الأدمن) ---
  const handleSendToSuppliers = (e) => {
    e.preventDefault();
    if (onOrderTrigger) {
      onOrderTrigger({
        id: `PO-${Date.now()}`,
        date: new Date().toISOString(),
        vendorId: orderRequest.supplier || 'مورد عام',
        supplierName: orderRequest.supplier || 'مورد عام',
        status: 'pending',
        items: [{
          productId: orderRequest.item,
          name: orderRequest.item,
          quantity: parseFloat(orderRequest.neededQty)
        }],
        totalAmount: 0,
        type: 'ERP_ORDER'
      });
    }
    alert(`تم إرسال طلب الاحتياج للمورد بنجاح`);
    setActiveView('menu');
  };

  // --- دالة حفظ الفاتورة (المتوافقة مع الأدمن وقاعدة البيانات) ---
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) {
      alert("يرجى إكمال بيانات الفاتورة"); return;
    }

    const total = parseFloat(formData.quantity) * parseFloat(formData.price);
    
    // هيكل البيانات الاحترافي الذي يقرأه الأدمن
    const purchaseOrder = {
      id: `INV-${Date.now()}`,
      date: formData.date,
      vendorId: formData.supplier || 'مورد عام',
      supplierName: formData.supplier || 'مورد عام',
      paymentMethod: formData.paymentMethod,
      status: 'completed',
      totalAmount: total,
      // البيانات الأصلية للموبايل لضمان عدم كسر العرض الداخلي
      item: formData.item,
      quantity: formData.quantity,
      price: formData.price,
      total: total,
      // هيكل المصفوفة للأدمن
      items: [{
        productId: formData.item,
        name: formData.item,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.price),
        total: total
      }]
    };

    onPurchaseComplete(purchaseOrder);
    alert(`تم الحفظ بنجاح رقم الفاتورة: ${purchaseOrder.id}`);
    
    setFormData({ item: '', unit: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] });
    setIsNewItem(false);
    setActiveView('menu');
  };

  const purchaseColumns = [
    { key: 'date', header: 'التاريخ', editable: false },
    { key: 'item', header: 'الصنف', editable: false },
    { key: 'quantity', header: 'الكمية', editable: false, render: v => v?.toLocaleString() },
    { key: 'price', header: 'السعر', editable: false, render: v => v?.toLocaleString() },
    { key: 'total', header: 'الإجمالي', editable: false, render: v => v?.toLocaleString() },
    { key: 'vendorId', header: 'المورد', editable: false },
    { key: 'paymentMethod', header: 'السداد', editable: false },
  ];

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', position: 'relative' }}>
      
      {lowStockItems.length > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: '10px', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <marquee style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 'bold' }}>
            تنبيه: الأصناف المنخفضة: {lowStockItems.map(i => `${i.name} (${i.balance || i.stock})`).join(' - ')}
          </marquee>
        </div>
      )}

      {activeView === 'menu' && (
        <>
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShoppingCart size={28} color="#1e5631" />
            <h2 style={{ margin: 0, color: '#1e293b' }}>نظام المشتريات</h2>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div className="glass-card" onClick={() => setActiveView('entry')} style={{ cursor: 'pointer', borderRight: '8px solid #1e5631', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Save size={24} color="#1e5631" />
                <div>
                  <h3 style={{ margin: 0 }}>فاتورة مشتريات</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>إضافة خامات للمخازن</p>
                </div>
              </div>
            </div>

            <div className="glass-card" onClick={() => setActiveView('orderRequest')} style={{ cursor: 'pointer', borderRight: '8px solid #f59e0b', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Truck size={24} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0 }}>طلب احتياج</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>إرسال نواقص للموردين</p>
                </div>
              </div>
            </div>

            {inventory.length > 0 && (
              <div className="glass-card" onClick={() => setActiveView('grid')} style={{ cursor: 'pointer', borderRight: '8px solid #3b82f6', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Table size={24} color="#3b82f6" />
                  <div>
                    <h3 style={{ margin: 0 }}>سجل المشتريات</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>عرض الأرشيف</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button onClick={onBack} className="btn-back" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '5px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white' }}>
            <ArrowRight size={18} /> العودة للرئيسية
          </button>
        </>
      )}

      {activeView === 'orderRequest' && (
        <div className="glass-card" style={{ background: 'white', padding: '20px', borderRadius: '15px' }}>
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ArrowRight size={20} /></button>
            <h3 style={{ margin: 0 }}>طلب احتياج جديد</h3>
          </div>
          <form onSubmit={handleSendToSuppliers}>
            <select className="glass-input" required onChange={e => handleItemSelectForOrder(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <option value="">اختر صنف...</option>
              {stock.map(s => <option key={s.id} value={s.name}>{s.name} (المتاح: {s.balance || s.stock})</option>)}
            </select>
            
            <select className="glass-input" required value={orderRequest.supplier} onChange={e => setOrderRequest({...orderRequest, supplier: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <option value="">اختر المورد المستهدف...</option>
              {suppliers.map(sup => <option key={sup.id || sup.name} value={sup.name}>{sup.name}</option>)}
              <option value="مورد عام">مورد عام</option>
            </select>

            <input type="number" className="glass-input" required placeholder="الكمية المطلوبة" value={orderRequest.neededQty} onChange={e => setOrderRequest({ ...orderRequest, neededQty: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold' }}>إرسال الطلب</button>
          </form>
        </div>
      )}

      {activeView === 'entry' && (
        <div className="glass-card" style={{ background: 'white', padding: '20px', borderRadius: '15px' }}>
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ArrowRight size={20} /></button>
            <h3 style={{ margin: 0 }}>إضافة فاتورة</h3>
          </div>
          <form onSubmit={handleSave}>
            {!isNewItem ? (
              <select className="glass-input" required value={formData.item} onChange={e => handleExistingItemSelect(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <option value="">اختر الصنف من المخزن...</option>
                {stock.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                <option value="NEW_ITEM">+ إضافة صنف جديد</option>
              </select>
            ) : (
              <input className="glass-input" placeholder="اسم الصنف الجديد" required value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="number" className="glass-input" placeholder="الكمية" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              <input type="number" className="glass-input" placeholder="السعر" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
            
            <select className="glass-input" required value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <option value="">اختر المورد...</option>
              {suppliers.map(sup => <option key={sup.id || sup.name} value={sup.name}>{sup.name}</option>)}
              <option value="مورد عام">مورد عام</option>
            </select>

            <select className="glass-input" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <option value="كاش">كاش</option>
              <option value="آجل">آجل</option>
            </select>
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#1e5631', color: 'white', fontWeight: 'bold' }}>حفظ الفاتورة</button>
          </form>
        </div>
      )}

      {activeView === 'grid' && (
        <div className="glass-card" style={{ background: 'white', padding: '20px', borderRadius: '15px' }}>
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ArrowRight size={20} /></button>
            <h3 style={{ margin: 0 }}>الأرشيف</h3>
          </div>
          <DataGrid columns={purchaseColumns} data={inventory} exportFileName="سجل_المشتريات" />
        </div>
      )}
    </div>
  );
};

export default PurchasesManager;
