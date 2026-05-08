import React, { useState, useRef } from 'react';
import { Layers, Download, Trash2, Plus, Save, FileSpreadsheet, ArrowRight, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryERP = ({ onBack }) => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'أسمنت لافارج', balance: 50, price: 150, unit: 'طن' },
    { id: 2, name: 'حديد عز 12مم', balance: 5, price: 40000, unit: 'طن' },
  ]);

  // تحديث خلية معينة في الجدول
  const handleCellChange = (id, field, value) => {
    const updatedData = categories.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setCategories(updatedData);
  };

  // إضافة صنف جديد فارغ للجدول
  const addNewRow = () => {
    const newRow = {
      id: Date.now(),
      name: '',
      balance: 0,
      price: 0,
      unit: 'وحدة'
    };
    setCategories([newRow, ...categories]);
  };

  const deleteRow = (id) => {
    setCategories(categories.filter(item => item.id !== id));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(categories);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "تقرير_المخزون.xlsx");
  };

  const styles = {
    container: { padding: '20px', direction: 'rtl', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Segoe UI', Tahoma, sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    tableContainer: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
    th: { backgroundColor: '#f8fafc', color: '#64748b', padding: '15px', borderBottom: '2px solid #e2e8f0', fontSize: '0.9rem' },
    td: { padding: '10px', borderBottom: '1px solid #f1f5f9' },
    input: { width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '1rem', transition: 'all 0.2s' },
    inputEdit: { border: '1px solid #cbd5e1', backgroundColor: '#fff' },
    actionBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    deleteBtn: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' },
    summaryCard: { marginTop: '20px', background: '#1e293b', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-around' }
  };

  const totalValue = categories.reduce((acc, curr) => acc + (curr.balance * curr.price), 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <TableIcon color="#2563eb" /> نظام الإدخال السريع (ERP Grid)
          </h2>
          <p style={{ color: '#64748b', margin: '5px 0' }}>قم بتعديل البيانات مباشرة داخل الجدول كأنك تستخدم Excel</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addNewRow} style={{ ...styles.actionBtn, background: '#10b981' }}>
            <Plus size={18} /> إضافة صنف
          </button>
          <button onClick={exportToExcel} style={{ ...styles.actionBtn, background: '#6366f1' }}>
            <Download size={18} /> حفظ كـ Excel
          </button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>اسم الصنف</th>
              <th style={styles.th}>الكمية</th>
              <th style={styles.th}>الوحدة</th>
              <th style={styles.th}>سعر الوحدة</th>
              <th style={styles.th}>إجمالي القيمة</th>
              <th style={styles.th}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>
                  <input 
                    style={{ ...styles.input, fontWeight: 'bold' }} 
                    value={item.name} 
                    onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
                    placeholder="أدخل اسم الصنف..."
                  />
                </td>
                <td style={styles.td}>
                  <input 
                    type="number"
                    style={{ ...styles.input, color: item.balance <= 5 ? '#ef4444' : '#1e293b' }} 
                    value={item.balance} 
                    onChange={(e) => handleCellChange(item.id, 'balance', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={styles.td}>
                  <input 
                    style={styles.input} 
                    value={item.unit} 
                    onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)}
                  />
                </td>
                <td style={styles.td}>
                  <input 
                    type="number"
                    style={styles.input} 
                    value={item.price} 
                    onChange={(e) => handleCellChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ ...styles.td, fontWeight: '900', color: '#059669' }}>
                  {(item.balance * item.price).toLocaleString()} ج.م
                </td>
                <td style={styles.td}>
                  <button onClick={() => deleteRow(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.summaryCard}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>إجمالي عدد الأصناف</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{categories.length}</div>
        </div>
        <div style={{ width: '1px', background: '#334155' }}></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>القيمة الإجمالية للمخزن</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{totalValue.toLocaleString()} ج.م</div>
        </div>
      </div>

      <button onClick={onBack} style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>
        <ArrowRight size={20} /> العودة للرئيسية
      </button>
    </div>
  );
};

export default InventoryERP;
