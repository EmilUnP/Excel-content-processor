import React, { useState, useMemo, useCallback, memo } from 'react';
import { Edit3, Trash2, Check, X } from 'lucide-react';

// Memoized cell component to prevent unnecessary re-renders
const TableCell = memo(({ 
  cell, 
  colIndex, 
  rowIndex, 
  isAnswerColumn, 
  getCellStyling, 
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
  
  if (isEditing) {
    return (
                    <div className="flex flex-col space-y-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        rows={3}
                        autoFocus
                        style={{ minHeight: '60px' }}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
    );
  }

  return (
                    <div className="group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="break-words overflow-hidden text-ellipsis max-h-[100px] overflow-y-auto">
                            {isAnswerColumn(colIndex) ? (
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  cell.cleaned === '1' || cell.cleaned === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                  {cell.cleaned === '1' || cell.cleaned === 1 ? '✓' : '✗'}
                                </span>
                                <span className="text-sm">
                                  {cell.cleaned || cell.original || 'Empty'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm">
                                {cell.cleaned || cell.original || 'Empty'}
                              </span>
                            )}
                          </div>
                          {cell.hasHtml && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              HTML content
                            </div>
                          )}
                          {cell.hasEntities && (
                            <div className="text-xs text-orange-600 mt-1 flex items-center">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                              HTML entities detected
                            </div>
                          )}
                          {cell.isEmpty && (
                            <div className="text-xs text-red-600 mt-1 flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                              Empty
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => handleEdit(rowIndex, colIndex, cell.cleaned)}
                            className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onCellDelete(rowIndex, colIndex)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.cell === nextProps.cell &&
    prevProps.colIndex === nextProps.colIndex &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.isAnswerColumn === nextProps.isAnswerColumn &&
    prevProps.editingCell === nextProps.editingCell &&
    prevProps.editValue === nextProps.editValue &&
    prevProps.setEditValue === nextProps.setEditValue &&
    prevProps.handleEdit === nextProps.handleEdit &&
    prevProps.handleSave === nextProps.handleSave &&
    prevProps.handleCancel === nextProps.handleCancel &&
    prevProps.handleKeyPress === nextProps.handleKeyPress &&
    prevProps.onCellDelete === nextProps.onCellDelete
  );
});

TableCell.displayName = 'TableCell';

const DataTable = React.memo(({ data, onCellEdit, onCellDelete, isLoading }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = useCallback((rowIndex, colIndex, currentValue) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    // Clean the value before editing - remove any HTML entities or complex formatting
    const cleanValue = String(currentValue || '').replace(/&#\d+;/g, '').trim();
    setEditValue(cleanValue);
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
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);


  // Memoize headers to avoid recalculation - dynamically adjust based on actual columns
  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const numCols = data[0]?.length || 0;
    const defaultHeaders = [
      'ID', 'Question ID', 'Question Text', 
      'Variant 1', 'Code 1', 'Variant 2', 'Code 2', 
      'Variant 3', 'Code 3', 'Variant 4', 'Code 4'
    ];
    
    // Return only the headers for columns that actually exist
    return defaultHeaders.slice(0, numCols);
  }, [data]);

  // Memoized helper function to determine if a column is an answer column
  const isAnswerColumn = useCallback((colIndex) => {
    return colIndex === 4 || colIndex === 6 || colIndex === 8 || colIndex === 10; // Answer columns
  }, []);

  // Memoized helper function to get cell styling based on content and column type
  const getCellStyling = useCallback((cell, colIndex) => {
    const baseClasses = "px-2 sm:px-4 py-3 text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] max-w-[200px] sm:max-w-[300px]";
    
    if (isAnswerColumn(colIndex)) {
      // Answer columns - highlight correct answers
      const isCorrect = cell.cleaned === '1' || cell.cleaned === 1;
      return `${baseClasses} ${isCorrect 
        ? 'bg-green-50 border-l-4 border-green-500 text-green-800 font-semibold' 
        : 'bg-red-50 border-l-4 border-red-300 text-red-700'
      }`;
    }
    
    if (colIndex === 2) {
      // Question text column - make it more prominent
      return `${baseClasses} bg-blue-50 border-l-4 border-blue-400 font-medium`;
    }
    
    if (colIndex === 0 || colIndex === 1) {
      // ID columns - make them compact
      return `${baseClasses} bg-gray-50 font-mono text-xs`;
    }
    
    // Variant columns - normal styling
    return `${baseClasses} bg-white`;
  }, [isAnswerColumn]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to display. Please upload an Excel file first.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 sticky left-0 z-20 min-w-[50px] sm:min-w-[60px] border-r border-gray-300">
              #
            </th>
            {data[0]?.map((_, colIndex) => {
              const isAnswerCol = isAnswerColumn(colIndex);
              const isQuestionCol = colIndex === 2;
              const isIdCol = colIndex === 0 || colIndex === 1;
              
              return (
                <th key={colIndex} className={`px-2 sm:px-4 py-3 text-left text-xs font-bold uppercase tracking-wider min-w-[100px] sm:min-w-[120px] border-r border-gray-200 ${
                  isAnswerCol 
                    ? 'bg-red-100 text-red-800' 
                    : isQuestionCol 
                    ? 'bg-blue-100 text-blue-800'
                    : isIdCol
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className="flex items-center space-x-1">
                    <span className="truncate">{headers[colIndex] || `Col ${colIndex + 1}`}</span>
                    {isAnswerCol && (
                      <span className="text-xs text-red-600 hidden sm:inline">(0/1)</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium bg-white sticky left-0 z-10 min-w-[50px] sm:min-w-[60px]">
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className={getCellStyling(cell, colIndex)}>
                  <TableCell
                    cell={cell}
                    colIndex={colIndex}
                    rowIndex={rowIndex}
                    isAnswerColumn={isAnswerColumn}
                    getCellStyling={getCellStyling}
                    editingCell={editingCell}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    handleEdit={handleEdit}
                    handleSave={handleSave}
                    handleCancel={handleCancel}
                    handleKeyPress={handleKeyPress}
                    onCellDelete={onCellDelete}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
