import * as XLSX from 'xlsx';

// Cached DOM element for better performance
let tempDiv = null;

// Function to decode HTML entities and clean up text (optimized)
export const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Use a single cached DOM element to avoid creating many elements
  if (!tempDiv) {
    tempDiv = document.createElement('div');
  }
  
  // First, handle numeric HTML entities like &#1057; &#1077; etc.
  let decodedText = text.replace(/&#(\d+);/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch (e) {
      return match; // Return original if decoding fails
    }
  });
  
  // Handle named HTML entities like &lt; &gt; &amp; etc.
  decodedText = decodedText
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Then handle any remaining HTML entities
  tempDiv.innerHTML = decodedText;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Function to clean HTML tags while preserving structure (optimized)
export const cleanHtmlContent = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return '';
  
  // Use the same cached DOM element for better performance
  if (!tempDiv) {
    tempDiv = document.createElement('div');
  }
  
  // First decode HTML entities, then clean HTML tags
  let decodedHtml = htmlString.replace(/&#(\d+);/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch (e) {
      return match; // Return original if decoding fails
    }
  });
  
  // Handle named HTML entities
  decodedHtml = decodedHtml
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  tempDiv.innerHTML = decodedHtml;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace and normalize text
  return textContent
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with single space
    .trim();
};

// Function to parse Excel file and extract content
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Use array format to preserve all data
          defval: '' // Default value for empty cells
        });
        
        // First, find the maximum number of columns that actually have data
        let maxCols = 0;
        for (const row of jsonData) {
          if (row && row.length > maxCols) {
            // Find the last non-empty column in this row
            for (let i = row.length - 1; i >= 0; i--) {
              if (row[i] !== undefined && row[i] !== null && String(row[i]).trim() !== '') {
                maxCols = Math.max(maxCols, i + 1);
                break;
              }
            }
          }
        }
        
        console.log(`Detected ${maxCols} columns with actual data (out of ${jsonData[0]?.length || 0} total columns)`);
        
        
        // Process data in batches for better performance
        const processedData = [];
        const batchSize = 100; // Process 100 rows at a time
        
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          const processedBatch = batch.map((row, batchRowIndex) => {
            const rowIndex = i + batchRowIndex;
            // Only process columns up to maxCols to avoid empty columns
            const limitedRow = row.slice(0, maxCols);
            
            return limitedRow.map((cell, cellIndex) => {
              if (typeof cell === 'string' && cell.trim()) {
                // Only process non-empty strings
                const hasHtml = cell.includes('<') && cell.includes('>');
                const hasEntities = cell.includes('&#');
                let cleanedContent = cell;
                let decodedContent = cell;
                
                if (hasHtml || hasEntities) {
                  // First decode HTML entities, then clean HTML tags
                  decodedContent = decodeHtmlEntities(cell);
                  cleanedContent = cleanHtmlContent(decodedContent);
                  
                }
                
                return {
                  original: cell,
                  cleaned: cleanedContent,
                  isEmpty: !cleanedContent.trim(),
                  hasHtml: hasHtml,
                  hasEntities: hasEntities,
                  row: rowIndex,
                  col: cellIndex
                };
              }
              
              // Handle empty cells or non-strings efficiently
              const cellStr = String(cell || '');
              return {
                original: cell,
                cleaned: cellStr,
                isEmpty: !cellStr.trim(),
                hasHtml: false,
                row: rowIndex,
                col: cellIndex
              };
            });
          });
          
          processedData.push(...processedBatch);
          
          // Allow UI to update between batches
          if (i + batchSize < jsonData.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        resolve({
          data: processedData,
          sheetName: firstSheetName,
          totalRows: processedData.length,
          totalCols: processedData[0]?.length || 0
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Function to export data back to Excel format
export const exportToExcel = (data, filename = 'processed_data.xlsx') => {
  // Convert processed data back to simple array format for Excel
  const excelData = data.map(row => 
    row.map(cell => cell.original || cell.cleaned)
  );
  
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');
  
  // Generate and download the file
  XLSX.writeFile(workbook, filename);
};

// Test function to verify HTML entity decoding
export const testHtmlDecoding = () => {
  const testText = '&#1057;&#1077;&#1090;&#1082;&#1072;&#10;&#1103;&#1095;&#1077;&#1077;&#1082; &#1076;&#1083;&#1103; &#1086;&#1073;&#1088;&#1072;&#1073;&#1086;&#1090;&#1082;&#1080; &#1076;&#1072;&#1085;&#1085;&#1099;&#1093;';
  const decoded = decodeHtmlEntities(testText);
  console.log('Original:', testText);
  console.log('Decoded:', decoded);
  return decoded;
};
