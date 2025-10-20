import React, { useState, useEffect } from 'react';
import { Target, X, Play } from 'lucide-react';

const RangeSelector = ({ 
  isVisible, 
  onClose, 
  onRangeSelect, 
  onRangeTranslate,
  totalRows,
  currentLanguage = 'en'
}) => {
  const [startRow, setStartRow] = useState(1);
  const [endRow, setEndRow] = useState(1);

  useEffect(() => {
    if (isVisible && totalRows > 0) {
      setStartRow(1);
      setEndRow(Math.min(50, totalRows)); // Default to first 50 rows
    }
  }, [isVisible, totalRows]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startRow <= endRow && startRow >= 1 && endRow <= totalRows) {
      onRangeSelect(startRow, endRow);
    }
  };

  const handleTranslateNow = () => {
    if (startRow <= endRow && startRow >= 1 && endRow <= totalRows) {
      onRangeSelect(startRow, endRow);
      onRangeTranslate(currentLanguage);
    }
  };

  const languageNames = {
    'en': 'English',
    'ru': 'Russian', 
    'az': 'Azerbaijani',
    'tr': 'Turkish'
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Select Translation Range
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Select which rows to translate. Total rows available: <span className="font-semibold">{totalRows}</span>
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Row
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalRows}
                    value={startRow}
                    onChange={(e) => setStartRow(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Row
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalRows}
                    value={endRow}
                    onChange={(e) => setEndRow(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Range:</strong> Rows {startRow} to {endRow} 
                  ({endRow - startRow + 1} rows total)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Target Language: {languageNames[currentLanguage] || 'English'}
                </p>
              </div>

              {startRow > endRow && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ Start row must be less than or equal to end row
                  </p>
                </div>
              )}

              {endRow > totalRows && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ End row cannot exceed total rows ({totalRows})
                  </p>
                </div>
              )}
            </form>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTranslateNow}
              disabled={startRow > endRow || endRow > totalRows || startRow < 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Translate Range</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeSelector;
