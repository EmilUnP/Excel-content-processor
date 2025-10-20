import React, { useState } from 'react';
import { X, Copy, Eye, EyeOff, Trash2, RefreshCw, Play } from 'lucide-react';

const DebugPanel = ({ isVisible, onClose, debugData, onClear, onRefresh, onTestTranslation }) => {
  const [showRawData, setShowRawData] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  console.log('🐛 DebugPanel received data:', debugData);

  if (!isVisible) return null;

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Eye className="h-6 w-6 mr-2 text-blue-600" />
              API Debug Panel
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
              >
                {showRawData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showRawData ? 'Hide Raw' : 'Show Raw'}
              </button>
              <button
                onClick={onRefresh}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
              <button
                onClick={onTestTranslation}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center"
              >
                <Play className="h-4 w-4 mr-1" />
                Test
              </button>
              <button
                onClick={onClear}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {debugData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No API calls yet</p>
              <p className="text-sm">Start translating or analyzing to see debug data</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {debugData.map((entry, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {entry.type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {entry.language || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(entry, null, 2), index)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedIndex === index ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input Data */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Input to API
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="mb-2">
                          <strong>Original Content:</strong>
                          <div className="mt-1 p-2 bg-white rounded border text-xs font-mono break-words">
                            {entry.originalContent}
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Cleaned Content:</strong>
                          <div className="mt-1 p-2 bg-white rounded border text-xs font-mono break-words">
                            {entry.cleanedContent}
                          </div>
                        </div>
                        {showRawData && (
                          <div>
                            <strong>API Request:</strong>
                            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
                              {formatJson(entry.apiRequest)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Output Data */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        API Response
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="mb-2">
                          <strong>Result:</strong>
                          <div className="mt-1 p-2 bg-white rounded border text-xs font-mono break-words">
                            {entry.result}
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Success:</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            entry.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.success ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {entry.error && (
                          <div className="mb-2">
                            <strong>Error:</strong>
                            <div className="mt-1 p-2 bg-red-50 rounded border text-xs text-red-700">
                              {entry.error}
                            </div>
                          </div>
                        )}
                        {showRawData && entry.apiResponse && (
                          <div>
                            <strong>Raw API Response:</strong>
                            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
                              {formatJson(entry.apiResponse)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
