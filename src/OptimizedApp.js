import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FileUpload from './components/FileUpload';
import OptimizedDataTable from './components/OptimizedDataTable';
import AnalysisPanel from './components/AnalysisPanel';
import LanguageSelector from './components/LanguageSelector';
import DebugPage from './components/DebugPage';
import ModelSelector from './components/ModelSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { parseExcelFile, exportToExcel, clearExcelCache } from './utils/optimizedExcelParser';
import { analyzeContent, translateBatchStructured, cancelTranslation, resetTranslationCancellation, clearCaches } from './utils/optimizedAiService';
import { API_ENDPOINTS } from './utils/constants';
import { FileSpreadsheet, Download, Globe, Database, BarChart3, Upload, Settings, X } from 'lucide-react';

function OptimizedApp() {
  // State management with optimized initial values
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSavedData, setIsCheckingSavedData] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showDebugPage, setShowDebugPage] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslationStopped, setIsTranslationStopped] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing data...');
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [sessionId, setSessionId] = useState(null);

  // Refs for performance optimization
  const translationAbortController = useRef(null);
  const analysisTimeoutRef = useRef(null);

  // Session management functions
  const startSession = useCallback(async (operation) => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    try {
      await fetch('http://localhost:3001/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId, operation })
      });
      console.log(`🔄 Session started: ${newSessionId} - ${operation}`);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
    
    return newSessionId;
  }, []);

  const stopSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await fetch('http://localhost:3001/api/session/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      console.log(`🛑 Session stopped: ${sessionId}`);
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
    
    setSessionId(null);
  }, [sessionId]);

  // Memoized data statistics
  const dataStats = useMemo(() => {
    if (!excelData) return { rows: 0, columns: 0, totalCells: 0 };
    
    const rows = excelData.length;
    const columns = excelData[0]?.length || 0;
    const totalCells = rows * columns;
    
    return { rows, columns, totalCells };
  }, [excelData]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Send cleanup request
        fetch('http://localhost:3001/api/session/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          keepalive: true // Important for page unload
        }).catch(() => {}); // Ignore errors during page unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on component unmount
      if (sessionId) {
        stopSession();
      }
    };
  }, [sessionId, stopSession]);

  // Optimized data loading - only load if no data exists
  const checkForSavedData = useCallback(async () => {
    setIsCheckingSavedData(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Checking saved data:', { hasData: !!data.data, currentData: !!excelData });
        if (data.success && data.data && !excelData) {
          // Only load saved data if no current data exists
          console.log('📥 Loading saved data:', data.data.length, 'rows');
          setExcelData(data.data);
          toast.success('Saved data loaded successfully!', {
            duration: 2000,
            position: 'top-right'
          });
        } else {
          console.log('🚫 Not loading saved data - either no data or current data exists');
        }
      }
    } catch (error) {
      console.log('No saved data found');
    } finally {
      setIsCheckingSavedData(false);
    }
  }, [excelData]);

  // Optimized file upload
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    try {
      // Clear Excel cache to ensure fresh file parsing
      clearExcelCache();
      console.log('🧹 Cleared Excel cache');
      
      const parsedData = await parseExcelFile(file);
      console.log('📤 File upload parsed:', parsedData.metadata);
      setExcelData(parsedData.data);
      
      // Clear old saved data when uploading new file
      try {
        const clearResponse = await fetch(API_ENDPOINTS.CLEAR_DATA, { method: 'POST' });
        const clearResult = await clearResponse.json();
        console.log('🧹 Cleared old saved data:', clearResult);
      } catch (error) {
        console.log('Could not clear old data:', error);
      }
      
      console.log('Excel data parsed successfully:', parsedData.metadata);
      
      toast.success(`File loaded: ${parsedData.metadata.totalRows} rows, ${parsedData.metadata.totalColumns} columns`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Error parsing Excel file: ' + error.message, {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized cell editing with debouncing
  const handleCellEdit = useCallback((rowIndex, colIndex, newValue) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex] && newData[rowIndex][colIndex]) {
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = {
          ...newData[rowIndex][colIndex],
          cleaned: newValue,
          original: newValue,
          isEmpty: !newValue || newValue.trim() === ''
        };
      }
      return newData;
    });
  }, []);

  // Optimized cell deletion
  const handleCellDelete = useCallback((rowIndex, colIndex) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      if (newData[rowIndex] && newData[rowIndex][colIndex]) {
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = {
          ...newData[rowIndex][colIndex],
          cleaned: '',
          original: '',
          isEmpty: true
        };
      }
      return newData;
    });
  }, []);

  // Optimized data saving
  const handleSaveData = useCallback(async () => {
    if (!excelData) return;

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SAVE_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: excelData }),
      });
      
      if (response.ok) {
        toast.success('Data saved successfully!', { duration: 2000 });
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [excelData]);

  // Optimized data loading
  const handleLoadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setExcelData(result.data);
          toast.success('Data loaded successfully!', { duration: 2000 });
        } else {
          toast('No saved data found', { duration: 2000 });
        }
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Load failed:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized bulk analysis with timeout
  const handleBulkAnalyze = useCallback(async () => {
    if (!excelData) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing content...');
    setTranslationProgress({ current: 0, total: 0 });
    
    // Clear any existing analysis timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    try {
      // Set a timeout for analysis
      analysisTimeoutRef.current = setTimeout(() => {
        toast.warning('Analysis taking longer than expected...', { duration: 3000 });
      }, 5000);

      // Sample data for analysis (first 1000 rows for performance)
      const sampleData = excelData.slice(0, 1000);
      const allContent = sampleData.map(row => 
        row.map(cell => cell.cleaned).join(' ')
      ).join('\n');
      
      const aiAnalysis = await analyzeContent(allContent);
      
      // Basic data analysis
      const dataAnalysis = {
        totalRows: excelData.length,
        sampleRows: sampleData.length,
        emptyCells: excelData.flat().filter(cell => cell.isEmpty).length,
        htmlCells: excelData.flat().filter(cell => cell.hasHtml).length,
        entityCells: excelData.flat().filter(cell => cell.hasEntities).length,
      };
      
      const comprehensiveAnalysis = {
        dataQuality: dataAnalysis,
        contentQuality: aiAnalysis,
        summary: {
          totalCells: dataStats.totalCells,
          emptyCells: dataAnalysis.emptyCells,
          htmlCells: dataAnalysis.htmlCells,
          entityCells: dataAnalysis.entityCells,
          overallQuality: aiAnalysis.quality,
          totalRows: excelData.length
        },
        recommendations: [
          ...aiAnalysis.suggestions,
          ...(dataAnalysis.emptyCells > 0 ? [`${dataAnalysis.emptyCells} empty cells need attention`] : []),
          ...(dataAnalysis.htmlCells > 0 ? [`${dataAnalysis.htmlCells} cells contain HTML`] : []),
          ...(dataAnalysis.entityCells > 0 ? [`${dataAnalysis.entityCells} cells contain HTML entities`] : [])
        ],
        isBulkAnalysis: true
      };
      
      setAnalysis(comprehensiveAnalysis);
      setShowAnalysis(true);
      
      clearTimeout(analysisTimeoutRef.current);
    } catch (error) {
      console.error('Bulk analysis failed:', error);
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [excelData, dataStats]);

  // Optimized bulk translation with abort controller
  const handleBulkTranslate = useCallback(async (targetLanguage = 'en') => {
    if (!excelData) return;

    // Cancel any existing translation
    if (translationAbortController.current) {
      translationAbortController.current.abort();
    }
    translationAbortController.current = new AbortController();

    setIsLoading(true);
    setIsTranslationStopped(false);
    resetTranslationCancellation();
    
    // Start session for translation
    await startSession(`translation_${targetLanguage}`);
    
    const languageNames = {
      'en': 'English', 'ru': 'Russian', 'az': 'Azerbaijani', 'tr': 'Turkish'
    };
    
    setLoadingMessage(`Translating to ${languageNames[targetLanguage] || 'English'}...`);
    
    try {
      // Collect unique content for translation
      const contentToTranslate = new Set();
      let totalCells = 0;
      let emptyCells = 0;
      let duplicateContent = 0;
      let filteredContent = 0;
      
      excelData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          totalCells++;
          if (cell.cleaned && cell.cleaned.trim()) {
            const content = cell.cleaned.trim();
            // Filter out very short content, numbers only, or common words
            if (content.length > 2 && 
                !/^\d+$/.test(content) && // Not just numbers
                !/^[A-Za-z]{1,2}$/.test(content) && // Not just 1-2 letters
                content !== '0' && content !== '1' && // Not just 0 or 1
                content !== 'true' && content !== 'false' && // Not boolean values
                content !== 'yes' && content !== 'no' // Not yes/no
            ) {
              if (contentToTranslate.has(content)) {
                duplicateContent++;
              }
              contentToTranslate.add(content);
            } else {
              filteredContent++;
              console.log('🚫 Filtered out content:', content);
            }
          } else {
            emptyCells++;
          }
        });
      });

      const uniqueContent = Array.from(contentToTranslate);
      console.log(`🔄 Found ${uniqueContent.length} unique pieces of content to translate`);
      console.log('📊 Current excelData:', { rows: excelData.length, totalCells: excelData.length * (excelData[0]?.length || 0) });
      console.log('📊 Content analysis:', { 
        totalCells, 
        emptyCells, 
        filteredContent,
        uniqueContent: uniqueContent.length, 
        duplicateContent,
        sampleContent: uniqueContent.slice(0, 5)
      });

      if (isTranslationStopped) {
        // Translation stopped
        toast('Translation stopped', { duration: 2000 });
        return;
      }

      console.log('🔄 Starting translation process...');
      console.log('📊 Content to translate:', uniqueContent.length, 'unique items');
      
      // Let AI service handle batching (it uses 80 items per batch)
      setTranslationProgress({ current: 0, total: 1 });
      setLoadingMessage(`Translating to ${languageNames[targetLanguage] || 'English'}...`);
      
      // Translate all content at once - AI service will handle batching internally
      const allTranslations = await translateBatchStructured(
        uniqueContent, 
        targetLanguage, 
        translationAbortController.current.signal
      );
      
      console.log('✅ Translation completed:', allTranslations.length, 'translations received');
      
      if (isTranslationStopped) {
        // Translation stopped
        toast('Translation stopped', { duration: 2000 });
        return;
      }
      
      // Create translation map
      const translationMap = new Map();
      uniqueContent.forEach((content, index) => {
        translationMap.set(content, allTranslations[index] || content);
      });

      console.log('🔄 Updating data with translations...');
      
      // Apply translations
      const translatedData = excelData.map((row) => 
        row.map((cell) => {
          if (cell.cleaned && cell.cleaned.trim()) {
            const translated = translationMap.get(cell.cleaned.trim()) || cell.cleaned;
            return {
              ...cell,
              cleaned: translated,
              original: translated
            };
          }
          return cell;
        })
      );
      
      console.log('✅ Data updated successfully');
      setExcelData(translatedData);
      
      // Stop session after successful completion
      await stopSession();
      
      // Translation completed
      toast.success(`Successfully translated to ${languageNames[targetLanguage] || 'English'}!`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      // Stop session on error
      await stopSession();
      
      if (error.name === 'AbortError') {
        // Translation stopped
        toast('Translation cancelled', { duration: 2000 });
      } else {
        console.error('Bulk translation failed:', error);
        // Translation stopped
        toast.error('Translation failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
      translationAbortController.current = null;
    }
  }, [excelData, isTranslationStopped, startSession, stopSession]);

  // Optimized stop translation
  const handleStopTranslation = useCallback(async () => {
    console.log('🛑 Stop translation requested');
    setIsTranslationStopped(true);
    setIsLoading(false);
    
    if (translationAbortController.current) {
      translationAbortController.current.abort();
    }
    
    // Stop session when stopping translation
    await stopSession();
    
    cancelTranslation();
    toast.dismiss();
    toast('Translation stopped by user', { duration: 2000 });
  }, [stopSession]);

  // Optimized language selection
  const handleLanguageSelect = useCallback((languageCode) => {
    setSelectedLanguage(languageCode);
    handleBulkTranslate(languageCode);
  }, [handleBulkTranslate]);

  // Optimized export
  const handleExportOriginal = useCallback(() => {
    if (!excelData) return;
    exportToExcel(excelData, 'processed_data.xlsx');
  }, [excelData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (translationAbortController.current) {
        translationAbortController.current.abort();
      }
    };
  }, []);

  // Initial data load
  // Initialize app with cache clearing
  useEffect(() => {
    // Clear all caches on app startup to ensure fresh state
    clearCaches();
    clearExcelCache();
    console.log('🧹 Cleared all caches on app startup');
    
    checkForSavedData();
  }, [checkForSavedData]);

  // Show debug page if requested
  if (showDebugPage) {
    return <DebugPage onBack={() => setShowDebugPage(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-50 to-blue-50 shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <FileSpreadsheet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Excel Content Processor
                </h1>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  AI-powered data processing and analysis
                </p>
              </div>
            </div>
            {excelData && (
              <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
                <button
                  onClick={handleBulkAnalyze}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze
                </button>
                <button
                  onClick={() => setShowLanguageSelector(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Translate
                </button>
                <button
                  onClick={handleSaveData}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2.5 rounded-xl hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-2.5 rounded-xl hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load
                </button>
                <button
                  onClick={handleExportOriginal}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2.5 rounded-xl hover:from-teal-600 hover:to-cyan-600 flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="bg-gradient-to-r from-slate-500 to-gray-500 text-white px-4 py-2.5 rounded-xl hover:from-slate-600 hover:to-gray-600 flex items-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Models
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stop Button - Always on top during translation */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-[9999]">
          <button
            onClick={handleStopTranslation}
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-rose-600 flex items-center text-base font-semibold shadow-2xl hover:shadow-red-500/25 transition-all duration-200 transform hover:-translate-y-0.5 border-2 border-red-400 animate-pulse"
            style={{ 
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 9999,
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            <X className="h-5 w-5 mr-2" />
            Stop Translation
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/20 to-blue-900/20 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center space-y-4 shadow-2xl pointer-events-auto border border-white/20 max-w-md">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="text-center">
              <span className="text-slate-700 font-semibold text-lg">{loadingMessage}</span>
              {translationProgress.total > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-slate-600">
                    Progress: {translationProgress.current} of {translationProgress.total} batches
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round((translationProgress.current / translationProgress.total) * 100)}% complete
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCheckingSavedData ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Checking for Saved Data
                </h2>
                <p className="text-gray-600 mb-6">
                  Looking for previously saved data...
                </p>
              </div>
            </div>
          </div>
        ) : !excelData ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                  <FileSpreadsheet className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Excel Content Processor
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Transform your complex HTML-encoded Excel data into clean, readable content. 
                  Upload, analyze, translate, and export with AI-powered processing.
                </p>
              </div>
              <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Summary Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                    Processed Data
                  </h2>
                  <p className="text-slate-600 mt-1 font-medium">
                    {dataStats.rows} rows • {dataStats.columns} columns • {dataStats.totalCells} cells
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-sm font-semibold">Ready</span>
                </div>
              </div>
            </div>

            {/* Optimized Data Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <OptimizedDataTable
                data={excelData}
                onCellEdit={handleCellEdit}
                onCellDelete={handleCellDelete}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </main>

      {/* Analysis Panel */}
      <AnalysisPanel
        analysis={analysis}
        isVisible={showAnalysis}
        onClose={() => setShowAnalysis(false)}
      />

      {/* Language Selector */}
      <LanguageSelector
        isVisible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageSelect={handleLanguageSelect}
        currentLanguage={selectedLanguage}
      />

      {/* Model Selector Modal */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
      />
    </div>
  );
}

// Wrap App with ErrorBoundary for better error handling
const OptimizedAppWithErrorBoundary = () => (
  <ErrorBoundary>
    <OptimizedApp />
  </ErrorBoundary>
);

export default OptimizedAppWithErrorBoundary;
