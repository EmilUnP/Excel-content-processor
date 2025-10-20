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
    if (!cell) return 'bg-slate-50 text-slate-400 italic';
    
    const baseClasses = 'border-b border-slate-100';
    const isEmpty = !cell.cleaned || cell.cleaned.trim() === '';
    
    // Check if this is a correct answer (Code columns with value = 1)
    // Code columns are: 4, 6, 8, 10 (Code 1, Code 2, Code 3, Code 4)
    const isCodeColumn = colIndex === 4 || colIndex === 6 || colIndex === 8 || colIndex === 10;
    const isCorrectAnswer = isCodeColumn && cell?.cleaned === '1';
    
    if (isEmpty) return `${baseClasses} bg-slate-50 text-slate-400 italic`;
    if (isCorrectAnswer) return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 border-l-4 border-l-green-400`;
    return `${baseClasses} bg-white text-slate-900 hover:bg-slate-50/50`;
  }, [cell, colIndex]);

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

  // Determine content type for badges
  const getContentBadges = () => {
    if (!cell) return [];
    
    const badges = [];
    const hasHtml = cell.hasHtml;
    const hasEntities = cell.hasEntities;
    
    if (hasHtml) badges.push({ text: 'HTML', color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm' });
    if (hasEntities) badges.push({ text: 'Entities', color: 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 shadow-sm' });
    
    // Check if this is a correct answer (Code columns with value = 1)
    // Code columns are: 4, 6, 8, 10 (Code 1, Code 2, Code 3, Code 4)
    const isCodeColumn = colIndex === 4 || colIndex === 6 || colIndex === 8 || colIndex === 10;
    const isCorrectAnswer = isCodeColumn && cell?.cleaned === '1';
    if (isCorrectAnswer) badges.push({ text: 'Correct', color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm' });
    
    return badges;
  };

  const contentBadges = getContentBadges();

  return (
    <div className={`${cellStyling} group relative min-h-[90px] flex items-start p-4`}>
      <div className="flex-1 flex flex-col">
        {/* Cell content */}
        <div 
          className="break-words overflow-wrap-anywhere whitespace-pre-wrap max-w-full text-sm leading-relaxed flex-1 font-mono" 
          title={cell?.cleaned || ''}
          style={{ 
            wordBreak: 'break-word', 
            overflowWrap: 'anywhere',
            lineHeight: '1.6',
            fontSize: '13px'
          }}
        >
          {cell?.cleaned || <span className="text-gray-400 italic">Empty</span>}
        </div>
        
        {/* Content badges at bottom */}
        {contentBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contentBadges.map((badge, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded-full border ${badge.color}`}
                title={`Content type: ${badge.text}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col space-y-2 ml-3 flex-shrink-0">
        <button
          onClick={() => handleEdit(rowIndex, colIndex, cell?.cleaned || '')}
          className="p-2 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          title="Edit cell"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onCellDelete(rowIndex, colIndex)}
          className="p-2 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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
  } = useVirtualScrolling(data, 110, 600);

  // Memoize column headers with proper names
  const columnHeaders = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const headers = [];
    const totalColumns = data[0]?.length || 0;
    
    for (let i = 0; i < totalColumns; i++) {
      if (i === 0) headers.push('ID');
      else if (i === 1) headers.push('ID 2');
      else if (i === 2) headers.push('Question');
      else if (i === 3) headers.push('Variant 1');
      else if (i === 4) headers.push('Code 1');
      else if (i === 5) headers.push('Variant 2');
      else if (i === 6) headers.push('Code 2');
      else if (i === 7) headers.push('Variant 3');
      else if (i === 8) headers.push('Code 3');
      else if (i === 9) headers.push('Variant 4');
      else if (i === 10) headers.push('Code 4');
      else headers.push(`Column ${i + 1}`);
    }
    
    return headers;
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
  // Determine if this is an answer column (Variant/Code columns)
  const isAnswerColumn = colIndex >= 3 && colIndex <= 10; // Variant and Code columns (3-11)
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
      {/* Virtual scrolling container */}
      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ height: '600px' }}
        onScroll={handleScroll}
      >
        {/* Header - positioned inside scroll container */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="flex">
            <div className="w-20 px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider flex-shrink-0 bg-slate-100/50">
              Row
            </div>
            {columnHeaders.map((header, index) => {
              // Match the same width logic as data rows
              const getColumnWidth = (colIndex) => {
                if (colIndex === 0) return 'min-w-[120px]'; // ID column
                if (colIndex === 1) return 'min-w-[100px]'; // ID 2 column
                if (colIndex === 2) return 'min-w-[300px]'; // Question column
                if (colIndex >= 3 && colIndex <= 10) return 'min-w-[150px]'; // Variant/Code columns
                return 'min-w-[120px]'; // Default width
              };
              
              return (
                <div key={index} className={`flex-1 ${getColumnWidth(index)} px-3 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-gradient-to-r from-slate-50 to-blue-50`}>
                  {header}
                </div>
              );
            })}
          </div>
        </div>

        {/* Data rows */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleDataWithIndices.map(({ rowData, actualIndex }) => (
              <div key={actualIndex} className="flex hover:bg-slate-50/50 transition-colors duration-150 border-b border-slate-100">
                <div className="w-20 px-4 py-4 text-sm text-slate-500 bg-slate-50/30 flex-shrink-0 font-semibold border-r border-slate-200">
                  {actualIndex + 1}
                </div>
                {rowData.map((cell, colIndex) => {
                  // Set different minimum widths based on column content
                  const getColumnWidth = (colIndex) => {
                    if (colIndex === 0) return 'min-w-[120px]'; // ID column - wider for long numbers
                    if (colIndex === 1) return 'min-w-[100px]'; // ID 2 column
                    if (colIndex === 2) return 'min-w-[300px]'; // Question column - much wider for long text
                    if (colIndex >= 3 && colIndex <= 10) return 'min-w-[150px]'; // Variant/Code columns
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
