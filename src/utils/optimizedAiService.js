// Optimized AI Service with aggressive performance improvements
import axios from 'axios';

// Enhanced caching with LRU eviction
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

// Performance-optimized caches
const analysisCache = new LRUCache(500);
const translationCache = new LRUCache(2000);
const contentCache = new LRUCache(1000);

// Translation cancellation support
let translationCancelled = false;

// OpenAI API configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Optimized models configuration
const OPTIMIZED_MODELS = {
  TRANSLATION: {
    'gpt-3.5-turbo-16k': {
      name: 'GPT-3.5 Turbo 16K',
      description: 'Good balance of speed and cost',
      maxTokens: 5000,
      cost: 'medium',
      structuredOutput: false,
      contextWindow: 16384,
      batchSize: 100,
      pricing: {
        input: '$0.0003',
        output: '$0.0006',
        unit: 'per 1K tokens'
      }
    },
    'gpt-4o': {
      name: 'GPT-4o',
      description: 'Best quality with optimized performance',
      maxTokens: 8000,
      cost: 'high',
      structuredOutput: true,
      contextWindow: 128000,
      batchSize: 100,
      pricing: {
        input: '$0.0025',
        output: '$0.01',
        unit: 'per 1K tokens'
      }
    },
    'gpt-5-mini': {
      name: 'GPT-5 Mini',
      description: 'Lightweight and efficient for quick translations',
      maxTokens: 6000,
      cost: 'low',
      structuredOutput: true,
      contextWindow: 128000,
      batchSize: 100,
      pricing: {
        input: '$0.00015',
        output: '$0.0006',
        unit: 'per 1K tokens'
      }
    },
    'gpt-5': {
      name: 'GPT-5',
      description: 'Next-generation model with superior translation accuracy',
      maxTokens: 10000,
      cost: 'high',
      structuredOutput: true,
      contextWindow: 200000,
      batchSize: 100,
      pricing: {
        input: '$0.005',
        output: '$0.015',
        unit: 'per 1K tokens'
      }
    },
    'gpt-5-nano': {
      name: 'GPT-5 Nano',
      description: 'Ultra-fast model for basic translation tasks',
      maxTokens: 4000,
      cost: 'low',
      structuredOutput: false,
      contextWindow: 32000,
      batchSize: 100,
      pricing: {
        input: '$0.0001',
        output: '$0.0003',
        unit: 'per 1K tokens'
      }
    }
  },
  ANALYSIS: {
    'gpt-5-mini': {
      name: 'GPT-5 Mini',
      description: 'Efficient analysis with good accuracy',
      maxTokens: 800,
      cost: 'low',
      structuredOutput: true,
      pricing: {
        input: '$0.00015',
        output: '$0.0006',
        unit: 'per 1K tokens'
      }
    },
    'gpt-5-nano': {
      name: 'GPT-5 Nano',
      description: 'Ultra-fast analysis for basic content review',
      maxTokens: 400,
      cost: 'low',
      structuredOutput: false,
      pricing: {
        input: '$0.0001',
        output: '$0.0003',
        unit: 'per 1K tokens'
      }
    }
  }
};

// Default optimized model selection
let DEFAULT_TRANSLATION_MODEL = 'gpt-5-mini';
let DEFAULT_ANALYSIS_MODEL = 'gpt-5-mini';

// Export model information
export const getAvailableModels = () => OPTIMIZED_MODELS;
export const getCurrentModels = () => ({
  translation: DEFAULT_TRANSLATION_MODEL,
  analysis: DEFAULT_ANALYSIS_MODEL
});

export const setModel = (task, modelId) => {
  if (task === 'translation' && OPTIMIZED_MODELS.TRANSLATION[modelId]) {
    DEFAULT_TRANSLATION_MODEL = modelId;
    console.log(`🔄 Translation model changed to: ${OPTIMIZED_MODELS.TRANSLATION[modelId].name}`);
  } else if (task === 'analysis' && OPTIMIZED_MODELS.ANALYSIS[modelId]) {
    DEFAULT_ANALYSIS_MODEL = modelId;
    console.log(`🔄 Analysis model changed to: ${OPTIMIZED_MODELS.ANALYSIS[modelId].name}`);
  }
};

// Optimized content cleaning with caching
const cleanContentForTranslation = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Check cache first
  const cacheKey = `clean_${content.length}_${content.slice(0, 20)}`;
  const cached = contentCache.get(cacheKey);
  if (cached) return cached;
  
  const cleaned = content
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
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  contentCache.set(cacheKey, cleaned);
  return cleaned;
};

// Optimized analysis function
export const analyzeContent = async (content) => {
  const cacheKey = `analysis_${content.length}_${content.slice(0, 50)}`;
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    const fallback = getFallbackAnalysis(content);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const cleanedContent = cleanContentForTranslation(content);
    const truncatedContent = cleanedContent.length > 1500 
      ? cleanedContent.substring(0, 1500) + '...'
      : cleanedContent;

    const selectedModel = DEFAULT_ANALYSIS_MODEL;
    const modelConfig = OPTIMIZED_MODELS.ANALYSIS[selectedModel];
    
    const apiRequest = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: 'Analyze content quality. Return JSON: {"isComplete": boolean, "hasIssues": boolean, "quality": "good|fair|poor", "suggestions": ["string"]}'
        },
        {
          role: 'user',
          content: `Analyze: "${truncatedContent}"`
        }
      ],
      max_tokens: modelConfig.maxTokens,
      temperature: 0.2
    };

    const response = await axios.post(OPENAI_API_URL, apiRequest, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      analysis = getFallbackAnalysis(content);
    }

    analysisCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.warn('Analysis API error:', error.message);
    const fallback = getFallbackAnalysis(content);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Optimized batch translation with aggressive batching
export const translateBatchStructured = async (contentArray, targetLanguage = 'en', abortSignal = null, progressCallback = null) => {
  
  translationCancelled = false;
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
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
  const modelConfig = OPTIMIZED_MODELS.TRANSLATION[selectedModel];

  // Use standard batch size of 100 for all models
  const BATCH_SIZE = 100;
  const allTranslations = [];
  
  // Pre-clean all content
  const cleanedContent = contentArray.map(content => {
    const cleaned = cleanContentForTranslation(content);
    return cleaned.length > 1500 ? cleaned.substring(0, 1500) + '...' : cleaned;
  });

  for (let i = 0; i < cleanedContent.length; i += BATCH_SIZE) {
    // Check for cancellation via abort signal
    if (abortSignal && abortSignal.aborted) {
      console.log('🛑 Translation cancelled via abort signal');
      throw new Error('Translation cancelled by user');
    }
    
    if (translationCancelled) {
      console.log('🛑 Translation cancelled');
      throw new Error('Translation cancelled by user');
    }

    const batch = cleanedContent.slice(i, i + BATCH_SIZE);
    const currentBatch = Math.floor(i/BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(cleanedContent.length/BATCH_SIZE);
    
    // Call progress callback if provided
    if (progressCallback) {
      progressCallback(currentBatch, totalBatches);
    }
    
    try {
      const apiRequest = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the provided content to ${targetLanguageName}. 

IMPORTANT RULES:
- Do NOT add any numbering, bullets, or formatting
- Do NOT add "1.", "2.", "3." or similar numbering
- Translate the content exactly as provided
- Maintain the original structure and meaning
- Return JSON format: {"translations": ["translated1", "translated2", ...]}`
          },
          {
            role: 'user',
            content: `Translate these ${batch.length} items to ${targetLanguageName}. Do NOT add any numbering, bullets, or formatting. Just translate the content exactly as provided:\n\n${batch.join('\n\n')}`
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
        },
        signal: abortSignal
      });

      if (translationCancelled) {
        throw new Error('Translation cancelled by user');
      }

      // Check abort signal after API call
      if (abortSignal && abortSignal.aborted) {
        console.log('🛑 Translation cancelled via abort signal after API call');
        throw new Error('Translation cancelled by user');
      }

      const aiResponse = response.data.choices[0].message.content;
      const jsonResponse = JSON.parse(aiResponse);
      
      let translations = [];
      if (jsonResponse.translations && Array.isArray(jsonResponse.translations)) {
        translations = jsonResponse.translations;
      } else if (Array.isArray(jsonResponse)) {
        translations = jsonResponse;
      } else {
        translations = Object.values(jsonResponse);
      }
      
      // Ensure proper order and fill missing translations
      const paddedTranslations = [];
      for (let j = 0; j < batch.length; j++) {
        if (j < translations.length && translations[j] && translations[j].trim()) {
          paddedTranslations.push(translations[j]);
        } else {
          paddedTranslations.push(batch[j]); // Use original if translation missing
        }
      }
      
      allTranslations.push(...paddedTranslations);
      
    } catch (error) {
      console.error(`Batch translation error:`, error.message);
      // Add fallback translations
      allTranslations.push(...batch);
    }
  }

  return allTranslations;
};

// Comprehensive dataset analysis for data quality
export const analyzeDataset = (data) => {
  if (!data || data.length === 0) {
    return {
      totalQuestions: 0,
      dataQuality: 'No data',
      issues: ['No data to analyze'],
      recommendations: ['Upload data to analyze']
    };
  }

  const analysis = {
    totalQuestions: data.length,
    dataQuality: 'good',
    issues: [],
    recommendations: [],
    statistics: {
      questionsWithAllVariants: 0,
      questionsWithCorrectAnswer: 0,
      questionsWithMissingVariants: 0,
      questionsWithInvalidCodes: 0,
      questionsWithEmptyContent: 0,
      questionsWithDuplicateVariants: 0,
      questionsWithHTML: 0,
      questionsWithEntities: 0
    },
    detailedIssues: []
  };

  // Analyze each question
  data.forEach((row, rowIndex) => {
    const question = row[2]?.cleaned || ''; // Question column
    const variants = [
      row[3]?.cleaned || '', // Variant 1
      row[5]?.cleaned || '', // Variant 2
      row[7]?.cleaned || '', // Variant 3
      row[9]?.cleaned || ''  // Variant 4
    ];
    const codes = [
      row[4]?.cleaned || '', // Code 1
      row[6]?.cleaned || '', // Code 2
      row[8]?.cleaned || '', // Code 3
      row[10]?.cleaned || '' // Code 4
    ];

    // Check if question exists
    if (!question || question.trim() === '') {
      analysis.statistics.questionsWithEmptyContent++;
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'Empty Question',
        description: 'Question is empty or missing',
        severity: 'high'
      });
      return;
    }

    // Check for HTML content
    if (row[2]?.hasHtml) analysis.statistics.questionsWithHTML++;
    if (row[2]?.hasEntities) analysis.statistics.questionsWithEntities++;

    // Check variants
    const nonEmptyVariants = variants.filter(v => v && v.trim() !== '');
    const nonEmptyCodes = codes.filter(c => c && c.trim() !== '');

    // Check if all variants are present
    if (nonEmptyVariants.length < 4) {
      analysis.statistics.questionsWithMissingVariants++;
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'Missing Variants',
        description: `Only ${nonEmptyVariants.length}/4 variants present`,
        severity: 'medium',
        details: `Missing variants: ${variants.map((v, i) => v ? '' : `Variant ${i+1}`).filter(Boolean).join(', ')}`
      });
    } else {
      analysis.statistics.questionsWithAllVariants++;
    }

    // Check for duplicate variants
    const uniqueVariants = new Set(nonEmptyVariants);
    if (uniqueVariants.size < nonEmptyVariants.length) {
      analysis.statistics.questionsWithDuplicateVariants++;
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'Duplicate Variants',
        description: 'Some answer variants are identical',
        severity: 'medium'
      });
    }

    // Check answer codes
    const validCodes = nonEmptyCodes.filter(c => c === '0' || c === '1');
    const hasCorrectAnswer = validCodes.includes('1');
    
    if (validCodes.length !== nonEmptyCodes.length) {
      analysis.statistics.questionsWithInvalidCodes++;
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'Invalid Answer Codes',
        description: 'Answer codes should be 0 or 1 only',
        severity: 'high',
        details: `Invalid codes: ${nonEmptyCodes.filter(c => c !== '0' && c !== '1').join(', ')}`
      });
    }

    if (!hasCorrectAnswer && nonEmptyCodes.length > 0) {
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'No Correct Answer',
        description: 'No answer marked as correct (no code = 1)',
        severity: 'high'
      });
    } else if (hasCorrectAnswer) {
      analysis.statistics.questionsWithCorrectAnswer++;
    }

    // Check for multiple correct answers
    const correctAnswers = validCodes.filter(c => c === '1').length;
    if (correctAnswers > 1) {
      analysis.detailedIssues.push({
        row: rowIndex + 1,
        type: 'Multiple Correct Answers',
        description: `${correctAnswers} answers marked as correct`,
        severity: 'medium'
      });
    }
  });

  // Calculate data quality score
  const totalIssues = analysis.detailedIssues.length;
  const highSeverityIssues = analysis.detailedIssues.filter(i => i.severity === 'high').length;
  
  if (highSeverityIssues > analysis.totalQuestions * 0.1) {
    analysis.dataQuality = 'poor';
  } else if (totalIssues > analysis.totalQuestions * 0.2) {
    analysis.dataQuality = 'fair';
  }

  // Generate recommendations
  if (analysis.statistics.questionsWithMissingVariants > 0) {
    analysis.recommendations.push(`Add missing variants for ${analysis.statistics.questionsWithMissingVariants} questions`);
  }
  if (analysis.statistics.questionsWithInvalidCodes > 0) {
    analysis.recommendations.push(`Fix invalid answer codes for ${analysis.statistics.questionsWithInvalidCodes} questions`);
  }
  if (analysis.statistics.questionsWithDuplicateVariants > 0) {
    analysis.recommendations.push(`Remove duplicate variants for ${analysis.statistics.questionsWithDuplicateVariants} questions`);
  }
  if (analysis.statistics.questionsWithEmptyContent > 0) {
    analysis.recommendations.push(`Add missing questions for ${analysis.statistics.questionsWithEmptyContent} rows`);
  }

  // Generate summary issues
  if (analysis.statistics.questionsWithMissingVariants > 0) {
    analysis.issues.push(`${analysis.statistics.questionsWithMissingVariants} questions missing variants`);
  }
  if (analysis.statistics.questionsWithInvalidCodes > 0) {
    analysis.issues.push(`${analysis.statistics.questionsWithInvalidCodes} questions have invalid answer codes`);
  }
  if (analysis.statistics.questionsWithDuplicateVariants > 0) {
    analysis.issues.push(`${analysis.statistics.questionsWithDuplicateVariants} questions have duplicate variants`);
  }
  if (analysis.statistics.questionsWithEmptyContent > 0) {
    analysis.issues.push(`${analysis.statistics.questionsWithEmptyContent} questions are empty`);
  }

  return analysis;
};

// Fallback analysis function
const getFallbackAnalysis = (content) => {
  return {
    isComplete: content.length > 10,
    hasIssues: content.includes('undefined') || content.includes('null'),
    quality: content.length > 50 ? 'good' : content.length > 20 ? 'fair' : 'poor',
    suggestions: [
      ...(content.length < 10 ? ['Content seems too short'] : []),
      ...(content.includes('undefined') || content.includes('null') ? ['Contains undefined/null values'] : [])
    ]
  };
};

// Cancellation functions
export const cancelTranslation = () => {
  translationCancelled = true;
  console.log('🛑 Translation cancellation requested');
};


// Cache management
export const clearCaches = () => {
  analysisCache.clear();
  translationCache.clear();
  contentCache.clear();
  console.log('🧹 All caches cleared');
};

export const getCacheStats = () => ({
  analysis: analysisCache.cache.size,
  translation: translationCache.cache.size,
  content: contentCache.cache.size
});

// Debug functions for DebugPage
let debugData = [];

export const getDebugData = () => debugData;

export const clearDebugData = () => {
  debugData = [];
};

export const translateContent = async (content, targetLanguage = 'en') => {
  const startTime = performance.now();
  const debugEntry = {
    type: 'translation',
    language: targetLanguage,
    originalContent: content,
    cleanedContent: content,
    timestamp: new Date().toISOString(),
    success: false,
    result: null,
    error: null,
    duration: 0,
    apiRequest: null,
    apiResponse: null
  };

  try {
    const result = await translateBatchStructured([content], targetLanguage, null);
    debugEntry.success = true;
    debugEntry.result = result[0];
    debugEntry.duration = performance.now() - startTime;
  } catch (error) {
    debugEntry.error = error.message;
    debugEntry.duration = performance.now() - startTime;
  }

  debugData.push(debugEntry);
  return debugEntry.result;
};
