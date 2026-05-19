import React, { useState, useCallback } from 'react';
import { Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const DataGrid = ({ columns, data, onCellEdit, onBulkDelete, exportFileName, editable = true }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map(row => row.id));
    }
  };

  const startEdit = (rowId, colKey, currentValue) => {
    if (!editable) return;
    setEditingCell({ rowId, colKey });
    setEditValue(currentValue != null ? String(currentValue) : '');
  };

  const commitEdit = () => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.rowId, editingCell.colKey, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedRows.length} صف؟`)) return;
    onBulkDelete(selectedRows);
    setSelectedRows([]);
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const exportData = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col.header] = row[col.key] ?? '';
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, exportFileName || 'Sheet1');
    XLSX.writeFile(wb, `${exportFileName || 'data'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedRows.length > 0 && onBulkDelete && (
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '8px 14px', 
                borderRadius: '12px', 
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.15)', /* خلفية حمراء زجاجية داكنة */
                color: '#f87171', /* لون أحمر فاتح ومضيء يناسب الخلفية السوداء */
                fontWeight: 'bold',
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.85rem',
                fontFamily: "'Tajawal', sans-serif",
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <Trash2 size={15} /> حذف ({selectedRows.length})
            </button>
          )}
          {/* تم تعديل لون نص عدد الصفوف ليصبح واضحاً */}
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>{data.length} صف</span>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            padding: '8px 14px', 
            borderRadius: '12px', 
            border: 'none',
            background: '#166534', /* لون أخضر حيوي غامق ومناسب */
            color: 'white', 
            fontWeight: 'bold',
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.85rem',
            fontFamily: "'Tajawal', sans-serif", 
            boxShadow: '0 4px 14px rgba(22, 101, 52, 0.4)', /* توهج أخضر خفيف */
            transition: 'all 0.2s ease'
          }}
        >
          <Download size={15} /> تصدير Excel
        </button>
      </div>

      <div className="data-grid-container" style={{ maxHeight: '60vh', overflow: 'auto' }}>
        <table className="data-grid">
          <thead>
            <tr>
              {onBulkDelete && (
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onBulkDelete ? 1 : 0)} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className={selectedRows.includes(row.id) ? 'row-selected' : ''}>
                  {onBulkDelete && (
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                      />
                    </td>
                  )}
                  {columns.map(col => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                    const isEditable = editable && col.editable !== false;
                    return (
                      <td
                        key={col.key}
                        className={isEditable ? 'cell-editable' : ''}
                        onDoubleClick={() => isEditable && startEdit(row.id, col.key, row[col.key])}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={commitEdit}
                            type={col.type === 'number' ? 'number' : 'text'}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <span>{col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editable && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
          انقر مرتين على أي خلية للتعديل | Enter للحفظ | Escape للإلغاء
        </p>
      )}
    </div>
  );
};

export default DataGrid;
