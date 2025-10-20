import React, { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import AnalysisPanel from './components/AnalysisPanel';
import LanguageSelector from './components/LanguageSelector';
import DebugPage from './components/DebugPage';
import ModelSelector from './components/ModelSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { parseExcelFile, exportToExcel } from './utils/excelParser';
import { analyzeContent, translateBatchStructured, cancelTranslation, resetTranslationCancellation } from './utils/aiService';
import { API_ENDPOINTS } from './utils/constants';
import { FileSpreadsheet, Download, Globe, Database, BarChart3, Upload, Trash2, Settings, X } from 'lucide-react';

function App() {
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

  // Check for saved data on component mount
  useEffect(() => {
    checkForSavedData();
  }, []);

  const checkForSavedData = async () => {
    setIsCheckingSavedData(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setExcelData(data.data);
          console.log('Data loaded from file');
          toast.success('Saved data loaded successfully!', {
            duration: 3000,
            position: 'top-right'
          });
        }
      }
    } catch (error) {
      console.log('No saved data found or error loading:', error.message);
      // Don't show error toast for missing saved data, it's normal
    } finally {
      setIsCheckingSavedData(false);
    }
  };

  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const parsedData = await parseExcelFile(file);
      setExcelData(parsedData.data);
      console.log('Excel data parsed successfully:', parsedData);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error parsing Excel file: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCellEdit = useCallback((rowIndex, colIndex, newValue) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      newData[rowIndex][colIndex] = {
        ...newData[rowIndex][colIndex],
        cleaned: newValue,
        original: newValue // Update original as well
      };
      return newData;
    });
  }, []);

  const handleCellDelete = useCallback((rowIndex, colIndex) => {
    setExcelData(prevData => {
      const newData = [...prevData];
      newData[rowIndex][colIndex] = {
        ...newData[rowIndex][colIndex],
        cleaned: '',
        original: '',
        isEmpty: true
      };
      return newData;
    });
  }, []);

  const handleExportOriginal = () => {
    if (!excelData) return;
    exportToExcel(excelData, 'processed_data.xlsx');
  };


  const handleSaveData = async () => {
    if (!excelData) return;

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.SAVE_DATA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: excelData }),
      });
      
      if (response.ok) {
        alert('Data saved successfully!');
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DATA);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setExcelData(result.data);
          alert('Data loaded successfully!');
        } else {
          alert('No saved data found');
        }
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.CLEAR_DATA, {
          method: 'POST',
        });
        
        if (response.ok) {
    setExcelData(null);
    setAnalysis(null);
    setShowAnalysis(false);
          alert('Database cleared successfully!');
        } else {
          throw new Error('Failed to clear data');
        }
      } catch (error) {
        console.error('Clear failed:', error);
        alert('Failed to clear database: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkAnalyze = async () => {
    if (!excelData) return;

    setIsLoading(true);
    try {
      // Comprehensive data analysis
      const dataAnalysis = analyzeData(excelData);
      
      // AI content analysis
      const allContent = excelData.map(row => 
        row.map(cell => cell.cleaned).join(' ')
      ).join('\n');
      
      const aiAnalysis = await analyzeContent(allContent);
      
      // Combine both analyses into a comprehensive report
      const comprehensiveAnalysis = {
        dataQuality: dataAnalysis,
        contentQuality: aiAnalysis,
        summary: {
          totalCells: excelData.flat().length,
          emptyCells: dataAnalysis.emptyCells.length,
          htmlCells: dataAnalysis.htmlCells.length,
          entityCells: dataAnalysis.entityCells.length,
          problems: dataAnalysis.problems.length,
          overallQuality: aiAnalysis.quality,
        totalRows: excelData.length
        },
        recommendations: [
          ...aiAnalysis.suggestions,
          ...(dataAnalysis.emptyCells.length > 0 ? [`${dataAnalysis.emptyCells.length} empty cells need attention`] : []),
          ...(dataAnalysis.htmlCells.length > 0 ? [`${dataAnalysis.htmlCells.length} cells contain HTML that should be cleaned`] : []),
          ...(dataAnalysis.entityCells.length > 0 ? [`${dataAnalysis.entityCells.length} cells contain HTML entities that should be decoded`] : [])
        ],
        isBulkAnalysis: true
      };
      
      setAnalysis(comprehensiveAnalysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Bulk analysis failed:', error);
      alert('Bulk analysis failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };



  const handleBulkTranslate = useCallback(async (targetLanguage = 'en') => {
    console.log('🚀 handleBulkTranslate called with:', { targetLanguage, hasData: !!excelData });
    if (!excelData) return;

    setIsLoading(true);
    setIsTranslationStopped(false);
    resetTranslationCancellation();
    
    // Show translation started notification
    const languageNames = {
      'en': 'English', 'ru': 'Russian', 'az': 'Azerbaijani', 'tr': 'Turkish'
    };
    
    const loadingToast = toast.loading(`Translating to ${languageNames[targetLanguage] || 'English'}...`, {
      duration: Infinity,
      position: 'top-right'
    });
    
    try {
      // Collect all unique content that needs translation
      const contentToTranslate = new Set();
      
      excelData.forEach((row) => {
        row.forEach((cell) => {
          if (cell.cleaned && cell.cleaned.trim()) {
            contentToTranslate.add(cell.cleaned.trim());
          }
        });
      });

      const uniqueContent = Array.from(contentToTranslate);
      console.log(`🔄 Found ${uniqueContent.length} unique pieces of content to translate`);

      // Check if translation was stopped before starting
      if (isTranslationStopped) {
        console.log('🛑 Translation stopped before starting');
        toast.dismiss(loadingToast);
        toast.info('Translation stopped', { duration: 2000, position: 'top-right' });
        return;
      }

      // Translate all content in batches using structured output for better data preservation
      console.log(`🚀 Starting structured batch translation of ${uniqueContent.length} items...`);
      
      const translations = await translateBatchStructured(uniqueContent, targetLanguage);
      
      // Check if translation was stopped during processing
      if (isTranslationStopped) {
        console.log('🛑 Translation stopped during processing');
        toast.dismiss(loadingToast);
        toast.info('Translation stopped', { duration: 2000, position: 'top-right' });
        return;
      }
      
      // Create translation map
      const translationMap = new Map();
      uniqueContent.forEach((content, index) => {
        translationMap.set(content, translations[index] || content);
      });

      console.log(`✅ Batch translation completed!`);

      // Apply translations to all data
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
      
      setExcelData(translatedData);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Successfully translated to ${languageNames[targetLanguage] || 'English'}!`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Bulk translation failed:', error);
      toast.dismiss(loadingToast);
      toast.error('Translation failed: ' + error.message, {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  }, [excelData, isTranslationStopped]);

  // Data analysis function for comprehensive reporting
  const analyzeData = useCallback((data) => {
    const issues = {
      emptyCells: [],
      inconsistentCells: [],
      htmlCells: [],
      entityCells: [],
      problems: []
    };

    // Single pass through data for better performance
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellRef = `Row ${rowIndex + 1}, Column ${colIndex + 1}`;
        
        // Check for empty cells
        if (!cell.cleaned && !cell.original) {
          issues.emptyCells.push(cellRef);
        }
        
        // Check for inconsistent data
        if (cell.original && !cell.cleaned) {
          issues.inconsistentCells.push(cellRef);
        }
        
        // Check for HTML content
        if (cell.hasHtml) {
          issues.htmlCells.push(cellRef);
        }
        
        // Check for HTML entities
        if (cell.hasEntities) {
          issues.entityCells.push(cellRef);
        }
        
        // Check for null/undefined values
        if (cell.original === null || cell.original === undefined) {
          issues.problems.push(`${cellRef}: Contains null/undefined value`);
        }
      });
    });

    return issues;
  }, []);

  const handleLanguageSelect = useCallback((languageCode) => {
    setSelectedLanguage(languageCode);
    handleBulkTranslate(languageCode);
  }, [handleBulkTranslate]);

  const handleStopTranslation = useCallback(() => {
    console.log('🛑 Stop translation requested');
    setIsTranslationStopped(true);
    setIsLoading(false);
    cancelTranslation();
    toast.dismiss(); // Dismiss any loading toasts
    toast.info('Translation stopped by user', { duration: 2000, position: 'top-right' });
  }, []);


  const handleCloseLanguageSelector = useCallback(() => {
    setShowLanguageSelector(false);
  }, []);


  const handleShowDebugPage = useCallback(() => {
    setShowDebugPage(true);
  }, []);

  const handleBackFromDebug = useCallback(() => {
    setShowDebugPage(false);
  }, []);




  // Show debug page if requested
  if (showDebugPage) {
    return <DebugPage onBack={handleBackFromDebug} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
              <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Excel Content Processor
              </h1>
                <p className="text-sm text-gray-600 mt-1">
                  AI-powered data processing and analysis
                </p>
              </div>
            </div>
            {excelData && (
              <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                <button
                  onClick={handleBulkAnalyze}
                  disabled={isLoading}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze
                </button>
                <button
                  onClick={() => setShowLanguageSelector(true)}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Translate
                </button>
                {isLoading && (
                  <button
                    onClick={handleStopTranslation}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop
                  </button>
                )}
                <button
                  onClick={handleSaveData}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load
                </button>
                <button
                  onClick={handleExportOriginal}
                  className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button
                  onClick={handleClearDatabase}
                  disabled={isLoading}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </button>
                <button
                  onClick={handleShowDebugPage}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Debug
                </button>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Models
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Processing data...</span>
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
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
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
              
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-6 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload & Clean</h3>
                  <p className="text-gray-600">Upload your Excel file and automatically decode HTML entities</p>
                </div>
                <div className="p-6 bg-green-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze & Translate</h3>
                  <p className="text-gray-600">AI-powered analysis and translation to multiple languages</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit & Export</h3>
                  <p className="text-gray-600">Manual editing and export back to Excel format</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                      Processed Data
                    </h2>
                  <p className="text-gray-600 mt-1">
                      {excelData.length} rows • {excelData[0]?.length || 0} columns
                    </p>
                  </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-600 text-sm font-medium">Ready</span>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <DataTable
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
        onClose={handleCloseLanguageSelector}
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
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
