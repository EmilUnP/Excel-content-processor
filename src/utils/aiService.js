// AI Service for content analysis and translation
// Uses OpenAI API for real AI-powered analysis and translation

import axios from 'axios';

// Cache for analysis results to improve performance
const analysisCache = new Map();
const translationCache = new Map();

// Debug data collection
let debugData = [];
const MAX_DEBUG_ENTRIES = 50; // Keep last 50 API calls

// Translation cancellation support
let translationCancelled = false;

// OpenAI API configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Available models for different tasks - Updated with latest models
const MODELS = {
  TRANSLATION: {
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'Latest GPT-4 model - Best translation quality and structure preservation',
      maxTokens: 4000,
      cost: 'high',
      structuredOutput: true,
      contextWindow: 128000
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      description: 'Fast GPT-4 variant with excellent translation quality',
      maxTokens: 4000,
      cost: 'high',
      structuredOutput: true,
      contextWindow: 128000
    },
    'gpt-3.5-turbo-16k': {
      name: 'GPT-3.5 Turbo 16K',
      description: 'Good balance of quality and cost, larger context window',
      maxTokens: 3000,
      cost: 'medium',
      structuredOutput: false,
      contextWindow: 16384
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      description: 'Cost-effective option for simple translations',
      maxTokens: 2000,
      cost: 'low',
      structuredOutput: false,
      contextWindow: 4096
    }
  },
  ANALYSIS: {
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'Best analysis quality with advanced reasoning',
      maxTokens: 1000,
      cost: 'high',
      structuredOutput: true
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      description: 'Excellent analysis capabilities',
      maxTokens: 1000,
      cost: 'high',
      structuredOutput: true
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      description: 'Good analysis, cost-effective',
      maxTokens: 600,
      cost: 'low',
      structuredOutput: false
    }
  }
};

// Default model selection - Updated for best translation quality and structure preservation
let DEFAULT_TRANSLATION_MODEL = 'gpt-4o'; // Best translation quality and structure preservation
let DEFAULT_ANALYSIS_MODEL = 'gpt-4o'; // Best analysis quality

// Export model information for UI
export const getAvailableModels = () => MODELS;
export const getCurrentModels = () => ({
  translation: DEFAULT_TRANSLATION_MODEL,
  analysis: DEFAULT_ANALYSIS_MODEL
});

// Function to change models (for future UI implementation)
export const setModel = (task, modelId) => {
  if (task === 'translation' && MODELS.TRANSLATION[modelId]) {
    DEFAULT_TRANSLATION_MODEL = modelId;
    console.log(`🔄 Translation model changed to: ${MODELS.TRANSLATION[modelId].name}`);
  } else if (task === 'analysis' && MODELS.ANALYSIS[modelId]) {
    DEFAULT_ANALYSIS_MODEL = modelId;
    console.log(`🔄 Analysis model changed to: ${MODELS.ANALYSIS[modelId].name}`);
  } else {
    console.warn(`❌ Invalid model selection: ${task}/${modelId}`);
  }
};

// Debug environment variables
console.log('🔧 Environment check:', {
  REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY ? 'SET' : 'NOT SET',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV
});

// Check if OpenAI API key is available
const isOpenAIAvailable = () => {
  const hasKey = OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here';
  console.log('🔑 OpenAI API key check:', { 
    hasKey, 
    keyLength: OPENAI_API_KEY?.length || 0,
    keyPrefix: OPENAI_API_KEY?.substring(0, 10) || 'none'
  });
  return hasKey;
};

// Debug data management
export const getDebugData = () => {
  console.log('📤 getDebugData called, returning', debugData.length, 'entries');
  return debugData;
};

export const clearDebugData = () => {
  debugData = [];
};

// Translation cancellation functions
export const cancelTranslation = () => {
  translationCancelled = true;
  console.log('🛑 Translation cancellation requested');
};

export const resetTranslationCancellation = () => {
  translationCancelled = false;
  console.log('🔄 Translation cancellation reset');
};

const addDebugEntry = (entry) => {
  console.log('📝 Adding debug entry:', entry);
  debugData.unshift(entry); // Add to beginning
  if (debugData.length > MAX_DEBUG_ENTRIES) {
    debugData = debugData.slice(0, MAX_DEBUG_ENTRIES); // Keep only last 50
  }
  console.log('📊 Debug data now has', debugData.length, 'entries');
};

// Clean content for translation (removes HTML, decodes entities)
const cleanContentForTranslation = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  return content
    // Decode HTML entities
    .replace(/&#\d+;/g, (match) => {
      try {
        return String.fromCharCode(parseInt(match.slice(2, -1), 10));
      } catch {
        return match;
      }
    })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to generate cache key
const getCacheKey = (content, type = 'analysis') => {
  return `${type}_${content.length}_${content.slice(0, 50)}`;
};

export const analyzeContent = async (content) => {
  console.log('🔍 analyzeContent called with:', { content: content?.substring(0, 100) });
  
  // Check cache first
  const cacheKey = getCacheKey(content, 'analysis');
  if (analysisCache.has(cacheKey)) {
    console.log('📦 Using cached analysis');
    return analysisCache.get(cacheKey);
  }

  let analysis;

  if (isOpenAIAvailable()) {
    // Use real OpenAI API for analysis
    console.log('🤖 Using OpenAI API for content analysis');
    try {
      // Clean the content before sending to API
      const cleanedContent = cleanContentForTranslation(content);
      
      // Truncate very long content to avoid API limits (keep first 2000 chars)
      const truncatedContent = cleanedContent.length > 2000 
        ? cleanedContent.substring(0, 2000) + '... [truncated]'
        : cleanedContent;
      
      console.log('Cleaned content for analysis:', truncatedContent.substring(0, 100) + '...');

      const selectedModel = DEFAULT_ANALYSIS_MODEL;
      const modelConfig = MODELS.ANALYSIS[selectedModel];
      
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyzer. Analyze the given content and provide ONLY a valid JSON response with these exact fields: {"isComplete": boolean, "hasIssues": boolean, "quality": "good"|"fair"|"poor", "suggestions": ["string1", "string2"]}. Do not include any other text, explanations, or formatting - just the JSON object.'
          },
          {
            role: 'user',
            content: `Please analyze this content: "${truncatedContent}"`
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.3
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 Raw OpenAI response:', aiResponse);
      
      // Add debug entry
      addDebugEntry({
        type: 'Analysis',
        language: 'N/A',
        originalContent: content.substring(0, 500) + (content.length > 500 ? '... [truncated]' : ''),
        cleanedContent: truncatedContent,
        apiRequest: apiRequest,
        apiResponse: response.data,
        result: aiResponse,
        success: true,
        error: null,
        timestamp: new Date().toISOString()
      });
      
      // Try to parse JSON response, fallback to mock if parsing fails
      try {
        analysis = JSON.parse(aiResponse);
        console.log('✅ Successfully parsed OpenAI response:', analysis);
      } catch (parseError) {
        console.warn('❌ Failed to parse OpenAI response:', parseError.message);
        console.warn('Raw response was:', aiResponse);
        
        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully extracted and parsed JSON from response:', analysis);
          } catch (extractError) {
            console.warn('❌ Failed to extract JSON from response, using fallback');
            analysis = getFallbackAnalysis(content);
          }
        } else {
          console.warn('❌ No JSON found in response, using fallback');
          analysis = getFallbackAnalysis(content);
        }
      }
    } catch (error) {
      console.warn('OpenAI API error, using fallback analysis:', error.message);
      console.warn('Full error details:', error.response?.data || error);
      
      // Add debug entry for error
      addDebugEntry({
        type: 'Analysis',
        language: 'N/A',
        originalContent: content.substring(0, 500) + (content.length > 500 ? '... [truncated]' : ''),
        cleanedContent: cleanContentForTranslation(content).substring(0, 500) + (cleanContentForTranslation(content).length > 500 ? '... [truncated]' : ''),
        apiRequest: null,
        apiResponse: error.response?.data || null,
        result: null,
        success: false,
        error: `API Error: ${error.message}${error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : ''}`,
        timestamp: new Date().toISOString()
      });
      
      analysis = getFallbackAnalysis(content);
    }
  } else {
    // Use fallback analysis when OpenAI is not available
    console.log('⚠️ OpenAI API key not available, using fallback analysis');
    analysis = getFallbackAnalysis(content);
    
    // Add debug entry for fallback
    addDebugEntry({
      type: 'Analysis',
      language: 'N/A',
      originalContent: content,
      cleanedContent: cleanContentForTranslation(content),
      apiRequest: null,
      apiResponse: null,
      result: JSON.stringify(analysis),
      success: true,
      error: 'OpenAI API key not available - using fallback',
      timestamp: new Date().toISOString()
    });
  }

  // Cache the result
  analysisCache.set(cacheKey, analysis);
  
  // Limit cache size to prevent memory issues
  if (analysisCache.size > 100) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }

  return analysis;
};

// Fallback analysis function (original mock logic)
const getFallbackAnalysis = (content) => {
  return {
        isComplete: content.length > 10,
        hasIssues: content.includes('undefined') || content.includes('null'),
        quality: content.length > 50 ? 'good' : content.length > 20 ? 'fair' : 'poor',
    suggestions: [
      ...(content.length < 10 ? ['Content seems too short, consider adding more details'] : []),
      ...(content.includes('undefined') || content.includes('null') ? ['Content contains undefined or null values'] : []),
      ...(content.length > 100 && !content.includes('.') ? ['Consider adding punctuation for better readability'] : [])
    ]
  };
};

// New function for structured batch translation with exact data structure preservation
export const translateBatchStructured = async (contentArray, targetLanguage = 'en') => {
  console.log('🔄 translateBatchStructured called with:', { count: contentArray.length, targetLanguage });
  
  // Reset cancellation flag at start
  translationCancelled = false;
  
  if (!isOpenAIAvailable()) {
    console.log('⚠️ OpenAI API key not available, using fallback translation');
    return contentArray.map(content => cleanContentForTranslation(content));
  }

  const languageNames = {
    'en': 'English',
    'ru': 'Russian', 
    'az': 'Azerbaijani',
    'tr': 'Turkish'
  };

  const targetLanguageName = languageNames[targetLanguage] || 'English';
  const selectedModel = DEFAULT_TRANSLATION_MODEL;
  const modelConfig = MODELS.TRANSLATION[selectedModel];

  // Use structured output if supported by the model
  if (modelConfig.structuredOutput) {
    return await translateBatchWithStructuredOutput(contentArray, targetLanguage, targetLanguageName, selectedModel, modelConfig);
  } else {
    return await translateBatchLegacy(contentArray, targetLanguage, targetLanguageName, selectedModel, modelConfig);
  }
};

// Structured output translation for models that support it (GPT-4o, GPT-4 Turbo)
async function translateBatchWithStructuredOutput(contentArray, targetLanguage, targetLanguageName, selectedModel, modelConfig) {
  console.log('🎯 Using structured output for translation');
  
  const BATCH_SIZE = 60; // Optimized batch size for GPT-4o structured output
  const allTranslations = [];
  
  for (let i = 0; i < contentArray.length; i += BATCH_SIZE) {
    // Check for cancellation before processing each batch
    if (translationCancelled) {
      console.log('🛑 Translation cancelled during structured batch processing');
      throw new Error('Translation cancelled by user');
    }

    const batch = contentArray.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Processing structured batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(contentArray.length/BATCH_SIZE)} (${batch.length} items)`);
    
    const cleanedContent = batch.map(content => {
      const cleaned = cleanContentForTranslation(content);
      return cleaned.length > 2000 ? cleaned.substring(0, 2000) + '...' : cleaned;
    });
    
    try {
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given content to ${targetLanguageName}. You must return a JSON object with a "translations" key containing an array of translated texts in the exact same order as the input. Format: {"translations": ["translated1", "translated2", ...]}`
          },
          {
            role: 'user',
            content: `Translate these ${batch.length} items to ${targetLanguageName}. Return as JSON object with "translations" array:\n\n${cleanedContent.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 Structured response received');
      
      // Check for cancellation after API call
      if (translationCancelled) {
        console.log('🛑 Translation cancelled after API call');
        throw new Error('Translation cancelled by user');
      }
      
      try {
        const jsonResponse = JSON.parse(aiResponse);
        
        // Extract translations from the JSON response
        let translations = [];
        if (jsonResponse.translations && Array.isArray(jsonResponse.translations)) {
          translations = jsonResponse.translations;
        } else if (Array.isArray(jsonResponse)) {
          translations = jsonResponse;
        } else {
          // Fallback: try to extract values from object
          translations = Object.values(jsonResponse);
        }
        
        // Ensure we have the right number of translations and maintain order
        const paddedTranslations = [];
        let missingCount = 0;
        
        for (let i = 0; i < batch.length; i++) {
          if (i < translations.length && translations[i] && translations[i].trim()) {
            paddedTranslations.push(translations[i]);
          } else {
            // If translation is missing, use original content
            missingCount++;
            console.warn(`⚠️ Missing translation for structured item ${i + 1}, using original`);
            paddedTranslations.push(cleanedContent[i]);
          }
        }
        
        if (missingCount > 0) {
          console.warn(`⚠️ Structured batch: ${missingCount}/${batch.length} translations missing`);
        }
        
        allTranslations.push(...paddedTranslations);
        
        addDebugEntry({
          type: 'Structured Batch Translation',
          language: targetLanguage,
          originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
          cleanedContent: cleanedContent.slice(0, 3).join(' | ') + (cleanedContent.length > 3 ? '...' : ''),
          apiRequest: apiRequest,
          apiResponse: response.data,
          result: paddedTranslations.slice(0, 3).join(' | ') + (paddedTranslations.length > 3 ? '...' : ''),
          success: true,
          error: null,
          timestamp: new Date().toISOString()
        });
        
      } catch (parseError) {
        console.warn('❌ Failed to parse structured JSON response, falling back to legacy method');
        const fallbackTranslations = await translateBatchLegacy(batch, targetLanguage, targetLanguageName, selectedModel, modelConfig);
        allTranslations.push(...fallbackTranslations);
      }
      
    } catch (error) {
      console.error(`OpenAI API error for structured batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
      
      addDebugEntry({
        type: 'Structured Batch Translation',
        language: targetLanguage,
        originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        cleanedContent: batch.map(c => cleanContentForTranslation(c)).slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        apiRequest: null,
        apiResponse: error.response?.data || null,
        result: null,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Fallback to legacy method
      const fallbackTranslations = await translateBatchLegacy(batch, targetLanguage, targetLanguageName, selectedModel, modelConfig);
      allTranslations.push(...fallbackTranslations);
    }
  }
  
  return allTranslations;
}

// Legacy batch translation method for models without structured output support
async function translateBatchLegacy(contentArray, targetLanguage, targetLanguageName, selectedModel, modelConfig) {
  console.log('🔄 Using legacy batch translation method');
  
  let BATCH_SIZE = 60; // Increased batch size for better models
  const MAX_CONTENT_LENGTH = 2000;
  const MAX_REQUEST_SIZE = 15000; // Increased request size limit
  
  const allTranslations = [];
  
  for (let i = 0; i < contentArray.length; i += BATCH_SIZE) {
    // Check for cancellation before processing each batch
    if (translationCancelled) {
      console.log('🛑 Translation cancelled during legacy batch processing');
      throw new Error('Translation cancelled by user');
    }

    const batch = contentArray.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Processing legacy batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(contentArray.length/BATCH_SIZE)} (${batch.length} items)`);
    
    const cleanedContent = batch.map(content => {
      const cleaned = cleanContentForTranslation(content);
      return cleaned.length > MAX_CONTENT_LENGTH 
        ? cleaned.substring(0, MAX_CONTENT_LENGTH) + '...'
        : cleaned;
    });
    
    const requestSize = cleanedContent.join('\n').length;
    if (requestSize > MAX_REQUEST_SIZE) {
      console.warn(`⚠️ Request too large (${requestSize} chars), reducing batch size from ${BATCH_SIZE} to ${Math.floor(BATCH_SIZE * 0.7)}`);
      BATCH_SIZE = Math.floor(BATCH_SIZE * 0.7);
      i -= BATCH_SIZE;
      continue;
    }
    
    const batchPrompt = `Translate the following ${batch.length} items to ${targetLanguageName}. Return ONLY the translations in the exact same order, one per line, with no explanations, numbering, or additional text. Each line must contain only the translated text:\n\n${cleanedContent.map((content, index) => `${index + 1}. ${content}`).join('\n')}`;

    try {
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given content to ${targetLanguageName}. Return ONLY the translated text with no explanations, prefixes, numbering, or additional text. Each line must contain only the translated text.`
          },
          {
            role: 'user',
            content: batchPrompt
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.1
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Check for cancellation after API call
      if (translationCancelled) {
        console.log('🛑 Translation cancelled after legacy API call');
        throw new Error('Translation cancelled by user');
      }
      
      // Parse translations more carefully to maintain order
      const responseLines = aiResponse.split('\n').filter(line => line.trim());
      const translations = [];
      let missingCount = 0;
      
      for (let i = 0; i < batch.length; i++) {
        if (i < responseLines.length) {
          // Remove any numbering and clean the line
          const cleanedLine = responseLines[i].replace(/^\d+\.\s*/, '').trim();
          if (cleanedLine) {
            translations.push(cleanedLine);
          } else {
            missingCount++;
            console.warn(`⚠️ Empty translation for legacy item ${i + 1}, using original`);
            translations.push(cleanedContent[i]);
          }
        } else {
          // If we don't have enough translations, use original content
          missingCount++;
          console.warn(`⚠️ Missing translation for legacy item ${i + 1}, using original`);
          translations.push(cleanedContent[i]);
        }
      }
      
      if (missingCount > 0) {
        console.warn(`⚠️ Legacy batch: ${missingCount}/${batch.length} translations missing`);
      }

      addDebugEntry({
        type: 'Legacy Batch Translation',
        language: targetLanguage,
        originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        cleanedContent: cleanedContent.slice(0, 3).join(' | ') + (cleanedContent.length > 3 ? '...' : ''),
        apiRequest: apiRequest,
        apiResponse: response.data,
        result: translations.slice(0, 3).join(' | ') + (translations.length > 3 ? '...' : ''),
        success: true,
        error: null,
        timestamp: new Date().toISOString()
      });

      allTranslations.push(...translations);

    } catch (error) {
      console.error(`OpenAI API error for legacy batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
      
      addDebugEntry({
        type: 'Legacy Batch Translation',
        language: targetLanguage,
        originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        cleanedContent: batch.map(c => cleanContentForTranslation(c)).slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        apiRequest: null,
        apiResponse: error.response?.data || null,
        result: null,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      allTranslations.push(...batch.map(content => cleanContentForTranslation(content)));
    }
  }

  return allTranslations;
}

// New function for batch translation with size limits
export const translateBatch = async (contentArray, targetLanguage = 'en') => {
  console.log('🔄 translateBatch called with:', { count: contentArray.length, targetLanguage });
  
  if (!isOpenAIAvailable()) {
    console.log('⚠️ OpenAI API key not available, using fallback translation');
    return contentArray.map(content => cleanContentForTranslation(content));
  }

  const languageNames = {
    'en': 'English',
    'ru': 'Russian', 
    'az': 'Azerbaijani',
    'tr': 'Turkish'
  };

  const targetLanguageName = languageNames[targetLanguage] || 'English';

  // Process in larger batches with higher token limits
  let BATCH_SIZE = 50; // Start with moderate batch size
  const MAX_CONTENT_LENGTH = 2000; // Max characters per item
  const MAX_REQUEST_SIZE = 12000; // Max characters for entire request
  
  const allTranslations = [];
  
  for (let i = 0; i < contentArray.length; i += BATCH_SIZE) {
    const batch = contentArray.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(contentArray.length/BATCH_SIZE)} (${batch.length} items)`);
    
    // Clean and truncate content
    const cleanedContent = batch.map(content => {
      const cleaned = cleanContentForTranslation(content);
      return cleaned.length > MAX_CONTENT_LENGTH 
        ? cleaned.substring(0, MAX_CONTENT_LENGTH) + '...'
        : cleaned;
    });
    
    // Check if request is too large and reduce batch size if needed
    const requestSize = cleanedContent.join('\n').length;
    if (requestSize > MAX_REQUEST_SIZE) {
      console.warn(`⚠️ Request too large (${requestSize} chars), reducing batch size from ${BATCH_SIZE} to ${Math.floor(BATCH_SIZE * 0.7)}`);
      BATCH_SIZE = Math.floor(BATCH_SIZE * 0.7);
      // Retry with smaller batch
      i -= BATCH_SIZE;
      continue;
    }
    
    // Create batch prompt
    const batchPrompt = `Translate the following ${batch.length} items to ${targetLanguageName}. Return only the translations in the same order, one per line, with no explanations or additional text:\n\n${cleanedContent.map((content, index) => `${index + 1}. ${content}`).join('\n')}`;

    console.log(`📤 Sending batch request: ${requestSize} characters, ${batch.length} items`);

    try {

      const selectedModel = DEFAULT_TRANSLATION_MODEL;
      const modelConfig = MODELS.TRANSLATION[selectedModel];
      
      console.log(`🤖 Using model: ${modelConfig.name} (${selectedModel})`);
      
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given content to ${targetLanguageName}. Return ONLY the translated text with no explanations, prefixes, or additional text.`
          },
          {
            role: 'user',
            content: batchPrompt
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.1
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 Raw OpenAI batch response:', aiResponse.substring(0, 200) + '...');
      
      // Split response into individual translations
      const translations = aiResponse.split('\n').map(line => {
        // Remove numbering and clean up
        return line.replace(/^\d+\.\s*/, '').trim();
      });

      // Add debug entry for batch
      addDebugEntry({
        type: 'Batch Translation',
        language: targetLanguage,
        originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        cleanedContent: cleanedContent.slice(0, 3).join(' | ') + (cleanedContent.length > 3 ? '...' : ''),
        apiRequest: apiRequest,
        apiResponse: response.data,
        result: translations.slice(0, 3).join(' | ') + (translations.length > 3 ? '...' : ''),
        success: true,
        error: null,
        timestamp: new Date().toISOString()
      });

      allTranslations.push(...translations);

    } catch (error) {
      console.error(`OpenAI API error for batch ${Math.floor(i/BATCH_SIZE) + 1}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        requestSize: batchPrompt.length,
        batchSize: batch.length
      });
      
      // Add debug entry for error with detailed info
      addDebugEntry({
        type: 'Batch Translation',
        language: targetLanguage,
        originalContent: batch.slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        cleanedContent: batch.map(c => cleanContentForTranslation(c)).slice(0, 3).join(' | ') + (batch.length > 3 ? '...' : ''),
        apiRequest: {
          model: 'gpt-3.5-turbo',
          max_tokens: 3000,
          requestSize: batchPrompt.length,
          batchSize: batch.length
        },
        apiResponse: error.response?.data || null,
        result: null,
        success: false,
        error: `${error.message} (Status: ${error.response?.status})`,
        timestamp: new Date().toISOString()
      });
      
      // Add fallback translations for this batch
      allTranslations.push(...batch.map(content => cleanContentForTranslation(content)));
    }
  }

  return allTranslations;
};

export const translateContent = async (content, targetLanguage = 'en') => {
  console.log('🔄 translateContent called with:', { content: content?.substring(0, 100), targetLanguage });
  
  // Check cache first
  const cacheKey = getCacheKey(`${content}_${targetLanguage}`, 'translation');
  if (translationCache.has(cacheKey)) {
    console.log('📦 Using cached translation');
    return translationCache.get(cacheKey);
  }

  let translated;

  if (isOpenAIAvailable()) {
    // Use real OpenAI API for translation
    console.log(`🤖 Using OpenAI API for translation to ${targetLanguage}`);
    
    const languageNames = {
      'en': 'English',
      'ru': 'Russian', 
      'az': 'Azerbaijani',
      'tr': 'Turkish'
    };

    const targetLanguageName = languageNames[targetLanguage] || 'English';

    // Clean the content before sending to API (saves tokens and improves translation)
    const cleanedContent = cleanContentForTranslation(content);
    console.log('Cleaned content for translation:', cleanedContent);
    
    try {

      const selectedModel = DEFAULT_TRANSLATION_MODEL;
      const modelConfig = MODELS.TRANSLATION[selectedModel];
      
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given content to ${targetLanguageName}. Return ONLY the translated text with no explanations, prefixes, or additional text.`
          },
          {
            role: 'user',
            content: `Translate this to ${targetLanguageName}: "${cleanedContent}"`
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.1
      };

      const response = await axios.post(OPENAI_API_URL, apiRequest, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      translated = response.data.choices[0].message.content.trim();
      console.log('OpenAI translation result:', translated);

      // Add debug entry
      addDebugEntry({
        type: 'Translation',
        language: targetLanguage,
        originalContent: content,
        cleanedContent: cleanedContent,
        apiRequest: apiRequest,
        apiResponse: response.data,
        result: translated,
        success: true,
        error: null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('OpenAI API error, using fallback translation:', error.message);
      
      // Add debug entry for error
      addDebugEntry({
        type: 'Translation',
        language: targetLanguage,
        originalContent: content,
        cleanedContent: cleanedContent,
        apiRequest: null,
        apiResponse: null,
        result: null,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      translated = getFallbackTranslation(content, targetLanguage);
    }
  } else {
    // Use fallback translation when OpenAI is not available
    console.log('⚠️ OpenAI API key not available, using fallback translation');
    translated = getFallbackTranslation(content, targetLanguage);
    
    // Add debug entry for fallback
    addDebugEntry({
      type: 'Translation',
      language: targetLanguage,
      originalContent: content,
      cleanedContent: cleanContentForTranslation(content),
      apiRequest: null,
      apiResponse: null,
      result: translated,
      success: true,
      error: 'OpenAI API key not available - using fallback',
      timestamp: new Date().toISOString()
    });
  }

  // Cache the result
  translationCache.set(cacheKey, translated);
  
  // Limit cache size to prevent memory issues
  if (translationCache.size > 200) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }

  return translated;
};

// Fallback translation function (improved mock logic)
const getFallbackTranslation = (content, targetLanguage) => {
  // Use the same cleaning function for consistency
  return cleanContentForTranslation(content);
};

// Real AI implementation examples (uncomment and configure as needed):

/*
// OpenAI Implementation
export const analyzeContentOpenAI = async (content) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the following content for completeness and quality. Return a JSON object with isComplete (boolean), quality (string: poor/fair/good), and suggestions (array of strings).'
        },
        {
          role: 'user',
          content: content
        }
      ]
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

// Gemini Implementation
export const translateContentGemini = async (content, targetLanguage) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Translate the following text to ${targetLanguage}: ${content}`
        }]
      }]
    })
  });
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};
*/
