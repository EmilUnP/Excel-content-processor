import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Eye, EyeOff, Trash2, RefreshCw, Play, Download } from 'lucide-react';
import { getDebugData, clearDebugData, translateContent } from '../utils/aiService';

const DebugPage = ({ onBack }) => {
  const [debugData, setDebugData] = useState([]);
  const [showRawData, setShowRawData] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDebugData = () => {
    const data = getDebugData();
    console.log('🔄 Refreshing debug data:', data);
    setDebugData(data);
  };

  const clearData = () => {
    clearDebugData();
    setDebugData([]);
  };

  const testTranslation = async () => {
    setIsLoading(true);
    console.log('🧪 Testing translation...');
    try {
      const result = await translateContent('Hello world', 'az');
      console.log('🧪 Test translation result:', result);
      refreshDebugData();
    } catch (error) {
      console.error('🧪 Test translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAnalysis = async () => {
    setIsLoading(true);
    console.log('🧪 Testing analysis...');
    try {
      const { analyzeContent } = await import('../utils/aiService');
      const result = await analyzeContent('This is a test content for analysis');
      console.log('🧪 Test analysis result:', result);
      refreshDebugData();
    } catch (error) {
      console.error('🧪 Test analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportDebugData = () => {
    const dataStr = JSON.stringify(debugData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  // Auto-refresh every 5 seconds
  useEffect(() => {
    refreshDebugData();
    const interval = setInterval(refreshDebugData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">API Debug Console</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {debugData.length} API calls recorded
              </span>
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
              >
                {showRawData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showRawData ? 'Hide Raw' : 'Show Raw'}
              </button>
              <button
                onClick={refreshDebugData}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
              <button
                onClick={testTranslation}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-1" />
                Test Translation
              </button>
              <button
                onClick={testAnalysis}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-1" />
                Test Analysis
              </button>
              <button
                onClick={exportDebugData}
                disabled={debugData.length === 0}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={clearData}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {debugData.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-gray-400 mb-4">
                <RefreshCw className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API calls yet</h3>
              <p className="text-gray-500 mb-6">
                Start translating or analyzing data to see API calls here
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={testTranslation}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test Translation
                </button>
                <button
                  onClick={testAnalysis}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test Analysis
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {debugData.map((entry, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {entry.type}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {entry.language || 'N/A'}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                        {entry.success ? 'Success' : 'Error'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(entry, null, 2), index)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copiedIndex === index ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Data */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        Input to API
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Original Content:
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono break-words max-h-32 overflow-y-auto">
                            {entry.originalContent}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cleaned Content:
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono break-words max-h-32 overflow-y-auto">
                            {entry.cleanedContent}
                          </div>
                        </div>
                        {showRawData && entry.apiRequest && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              API Request:
                            </label>
                            <pre className="p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                              {formatJson(entry.apiRequest)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Output Data */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        API Response
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Result:
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono break-words max-h-32 overflow-y-auto">
                            {entry.result}
                          </div>
                        </div>
                        {entry.error && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Error:
                            </label>
                            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 break-words">
                              {entry.error}
                            </div>
                          </div>
                        )}
                        {showRawData && entry.apiResponse && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Raw API Response:
                            </label>
                            <pre className="p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                              {formatJson(entry.apiResponse)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPage;
