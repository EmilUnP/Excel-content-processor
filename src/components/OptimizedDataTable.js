import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { Edit3, Trash2, Check, X } from 'lucide-react';

// Virtual scrolling hook
const useVirtualScrolling = (items, itemHeight = 60, containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length);
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    visibleStart,
    visibleEnd,
    offsetY,
    totalHeight,
    handleScroll
  };
};

// Ultra-optimized cell component
const OptimizedTableCell = memo(({ 
  cell, 
  colIndex, 
  rowIndex, 
  isAnswerColumn, 
  editingCell, 
  editValue, 
  setEditValue, 
  handleEdit, 
  handleSave, 
  handleCancel, 
  handleKeyPress, 
  onCellDelete 
}) => {
  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
  
  // Memoize cell styling
  const cellStyling = useMemo(() => {
    if (!cell) return 'bg-gray-50 text-gray-400 italic';
    
    const baseClasses = 'border-b border-gray-200';
    const isEmpty = !cell.cleaned || cell.cleaned.trim() === '';
    const hasHtml = cell.hasHtml;
    const hasEntities = cell.hasEntities;
    
    if (isEmpty) return `${baseClasses} bg-gray-50 text-gray-400 italic`;
    if (hasHtml || hasEntities) return `${baseClasses} bg-yellow-50 text-yellow-800 border-l-4 border-l-yellow-400`;
    if (isAnswerColumn) return `${baseClasses} bg-blue-50 text-blue-900 border-l-4 border-l-blue-400`;
    return `${baseClasses} bg-white text-gray-900 hover:bg-gray-50`;
  }, [cell, isAnswerColumn]);

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-2 p-2">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          autoFocus
        />
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center"
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cellStyling} group relative min-h-[80px] flex items-start p-3`}>
      <div 
        className="flex-1 break-words overflow-wrap-anywhere whitespace-pre-wrap max-w-full text-sm leading-relaxed" 
        title={cell?.cleaned || ''}
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        {cell?.cleaned || <span className="text-gray-400 italic">Empty</span>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1 ml-3 flex-shrink-0">
        <button
          onClick={() => handleEdit(rowIndex, colIndex, cell?.cleaned || '')}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
          title="Edit cell"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onCellDelete(rowIndex, colIndex)}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 hover:border-red-300 transition-all"
          title="Delete cell"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

OptimizedTableCell.displayName = 'OptimizedTableCell';

const OptimizedDataTable = memo(({ 
  data, 
  onCellEdit, 
  onCellDelete, 
  isLoading = false 
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Virtual scrolling setup
  const {
    containerRef,
    visibleItems,
    visibleStart,
    offsetY,
    totalHeight,
    handleScroll
  } = useVirtualScrolling(data, 100, 600);

  // Memoize column headers
  const columnHeaders = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from({ length: data[0]?.length || 0 }, (_, i) => `Column ${i + 1}`);
  }, [data]);

  // Memoize visible data with row indices
  const visibleDataWithIndices = useMemo(() => {
    return visibleItems.map((row, index) => ({
      rowData: row,
      actualIndex: visibleStart + index
    }));
  }, [visibleItems, visibleStart]);

  // Optimized event handlers
  const handleEdit = useCallback((rowIndex, colIndex, currentValue) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(currentValue);
  }, []);

  const handleSave = useCallback(() => {
    if (editingCell) {
      onCellEdit(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onCellEdit]);

  const handleCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Memoize cell styling function
  const getCellStyling = useCallback((cell, colIndex) => {
    const isAnswerColumn = colIndex === 1; // Assuming column 1 is answers
    return { isAnswerColumn };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <div className="w-20 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex-shrink-0">
            Row
          </div>
          {columnHeaders.map((header, index) => {
            // Match the same width logic as data rows
            const getColumnWidth = (colIndex) => {
              if (colIndex === 0) return 'min-w-[120px]'; // ID column
              if (colIndex === 1) return 'min-w-[100px]'; // Question ID column
              if (colIndex === 2) return 'min-w-[300px]'; // Question text
              if (colIndex >= 3 && colIndex <= 10) return 'min-w-[150px]'; // Answer columns
              return 'min-w-[120px]'; // Default width
            };
            
            return (
              <div key={index} className={`flex-1 ${getColumnWidth(index)} px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                {header}
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ height: '600px' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleDataWithIndices.map(({ rowData, actualIndex }) => (
              <div key={actualIndex} className="flex hover:bg-gray-50">
                <div className="w-20 px-4 py-3 text-sm text-gray-500 border-b border-gray-200 bg-gray-50 flex-shrink-0 font-medium">
                  {actualIndex + 1}
                </div>
                {rowData.map((cell, colIndex) => {
                  // Set different minimum widths based on column content
                  const getColumnWidth = (colIndex) => {
                    if (colIndex === 0) return 'min-w-[120px]'; // ID column - wider for long numbers
                    if (colIndex === 1) return 'min-w-[100px]'; // Question ID column
                    if (colIndex === 2) return 'min-w-[300px]'; // Question text - much wider for long text
                    if (colIndex >= 3 && colIndex <= 10) return 'min-w-[150px]'; // Answer columns
                    return 'min-w-[120px]'; // Default width
                  };
                  
                  return (
                    <div key={`${actualIndex}-${colIndex}`} className={`flex-1 ${getColumnWidth(colIndex)}`}>
                      <OptimizedTableCell
                        cell={cell}
                        colIndex={colIndex}
                        rowIndex={actualIndex}
                        {...getCellStyling(cell, colIndex)}
                        editingCell={editingCell}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        handleEdit={handleEdit}
                        handleSave={handleSave}
                        handleCancel={handleCancel}
                        handleKeyPress={handleKeyPress}
                        onCellDelete={onCellDelete}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedDataTable.displayName = 'OptimizedDataTable';

export default OptimizedDataTable;
