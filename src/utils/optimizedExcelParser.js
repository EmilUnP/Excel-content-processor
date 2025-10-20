// Optimized Excel Parser with performance improvements
import * as XLSX from 'xlsx';

// Cache for parsed files
const fileCache = new Map();
const MAX_CACHE_SIZE = 10;

// Optimized HTML entity decoding
const decodeHTMLEntities = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
};

// Optimized HTML tag removal
const removeHTMLTags = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/<[^>]*>/g, '');
};

// Optimized cell processing
const processCell = (cellValue, rowIndex, colIndex) => {
  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return {
      original: '',
      cleaned: '',
      hasHtml: false,
      hasEntities: false,
      isEmpty: true
    };
  }

  const original = String(cellValue);
  const hasHtml = /<[^>]*>/.test(original);
  const hasEntities = /&[a-zA-Z0-9#]+;/.test(original);
  
  let cleaned = original;
  if (hasEntities) {
    cleaned = decodeHTMLEntities(cleaned);
  }
  if (hasHtml) {
    cleaned = removeHTMLTags(cleaned);
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    original,
    cleaned,
    hasHtml,
    hasEntities,
    isEmpty: !cleaned || cleaned.trim() === ''
  };
};

// Optimized Excel parsing with caching
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      // Check cache first
      const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
      if (fileCache.has(fileKey)) {
        console.log('📦 Using cached Excel data');
        resolve(fileCache.get(fileKey));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with optimized options
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use array format for better performance
            defval: '', // Default value for empty cells
            raw: false // Process all values as strings
          });

          // Filter out completely empty rows
          const filteredData = jsonData.filter(row => 
            row.some(cell => cell !== '' && cell !== null && cell !== undefined)
          );

          // Find columns that have any meaningful data
          const totalColumns = filteredData[0]?.length || 0;
          const columnsWithData = [];
          
          for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
            let hasData = false;
            
            // Check if this column has any non-empty data across all rows
            for (let rowIndex = 0; rowIndex < filteredData.length; rowIndex++) {
              const cell = filteredData[rowIndex]?.[colIndex];
              if (cell !== '' && cell !== null && cell !== undefined && String(cell).trim() !== '') {
                hasData = true;
                break;
              }
            }
            
            if (hasData) {
              columnsWithData.push(colIndex);
            }
          }
          
          console.log(`📊 Excel parsing: Found ${columnsWithData.length} columns with data out of ${totalColumns} total columns`);
          console.log(`📊 Visible columns:`, columnsWithData);

          // Process data in chunks for better performance, only including columns with data
          const processedData = [];
          const CHUNK_SIZE = 100; // Process 100 rows at a time
          
          for (let i = 0; i < filteredData.length; i += CHUNK_SIZE) {
            const chunk = filteredData.slice(i, i + CHUNK_SIZE);
            const processedChunk = chunk.map((row, rowIndex) => 
              columnsWithData.map((colIndex) => 
                processCell(row[colIndex], i + rowIndex, colIndex)
              )
            );
            processedData.push(...processedChunk);
          }

          const result = {
            data: processedData,
            metadata: {
              fileName: file.name,
              totalRows: processedData.length,
              totalColumns: processedData[0]?.length || 0,
              originalColumns: totalColumns,
              visibleColumns: columnsWithData,
              filteredColumns: totalColumns - columnsWithData.length,
              sheetName: sheetName,
              processedAt: new Date().toISOString()
            }
          };

          // Cache the result
          if (fileCache.size >= MAX_CACHE_SIZE) {
            const firstKey = fileCache.keys().next().value;
            fileCache.delete(firstKey);
          }
          fileCache.set(fileKey, result);

          console.log('✅ Excel parsed successfully:', {
            rows: processedData.length,
            columns: processedData[0]?.length || 0,
            cached: true
          });

          resolve(result);
        } catch (error) {
          console.error('Error processing Excel data:', error);
          reject(new Error('Failed to process Excel file: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      reject(new Error('Failed to read file: ' + error.message));
    }
  });
};

// Optimized Excel export
export const exportToExcel = (data, filename = 'exported_data.xlsx') => {
  try {
    // Convert data back to simple array format
    const exportData = data.map(row => 
      row.map(cell => cell.cleaned || '')
    );

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Set column widths for better readability
    const colWidths = [];
    for (let i = 0; i < (data[0]?.length || 0); i++) {
      let maxLength = 10; // Minimum width
      for (let j = 0; j < Math.min(data.length, 100); j++) { // Check first 100 rows
        const cellValue = data[j]?.[i]?.cleaned || '';
        if (cellValue.length > maxLength) {
          maxLength = Math.min(cellValue.length, 50); // Cap at 50 characters
        }
      }
      colWidths.push({ wch: maxLength });
    }
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file exported:', filename);
  } catch (error) {
    console.error('Error exporting Excel file:', error);
    throw new Error('Failed to export Excel file: ' + error.message);
  }
};

// Cache management
export const clearExcelCache = () => {
  fileCache.clear();
  console.log('🧹 Excel cache cleared');
};

export const getExcelCacheStats = () => ({
  size: fileCache.size,
  maxSize: MAX_CACHE_SIZE,
  keys: Array.from(fileCache.keys())
});
