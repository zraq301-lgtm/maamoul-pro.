// 1. تعديل دالة إرسال طلب الاحتياج (لتظهر في "طلبات الشراء" بالأدمن)
  const handleSendToSuppliers = (e) => {
    e.preventDefault();
    if (onOrderTrigger) {
      onOrderTrigger({
        id: `PO-${Date.now()}`,
        date: new Date().toISOString(),
        items: [{
          productId: orderRequest.item,
          quantity: parseFloat(orderRequest.neededQty),
          name: orderRequest.item
        }],
        vendorId: orderRequest.supplier || 'مورد عام',
        status: 'pending', // الأدمن يفهم pending كحالة "قيد الانتظار"
        totalAmount: 0,
        type: 'ERP_ORDER'
      });
    }
    alert(`تم إرسال الطلب للمورد بنجاح`);
    setActiveView('menu');
  };

  // 2. تعديل دالة حفظ الفاتورة (لتظهر في "المشتريات" بالأدمن)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) {
      alert("يرجى إكمال بيانات الفاتورة"); return;
    }

    // تجهيز البيانات لتطابق موديل PurchaseOrder في الأدمن
    const purchaseForAdmin = {
      id: `INV-${Date.now()}`,
      date: formData.date,
      vendorId: formData.supplier || 'مورد عام',
      status: 'completed', // الأدمن يفهم completed كفاتورة تم استلامها
      items: [
        {
          productId: formData.item,
          name: formData.item,
          quantity: parseFloat(formData.quantity),
          unitPrice: parseFloat(formData.price),
          total: parseFloat(formData.quantity) * parseFloat(formData.price)
        }
      ],
      totalAmount: parseFloat(formData.quantity) * parseFloat(formData.price),
      paymentMethod: formData.paymentMethod,
      notes: "تم الإدخال عبر تطبيق المصنع"
    };

    onPurchaseComplete(purchaseForAdmin); // إرسالها للمزامنة مع GitHub
    
    alert(`تم حفظ الفاتورة بنجاح ومزامنتها مع النظام`);
    setFormData({ item: '', unit: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] });
    setIsNewItem(false);
    setActiveView('menu');
  };
