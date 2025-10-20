# OpenAI API Setup Instructions

## Step 1: Create .env file
Create a `.env` file in the root directory of your project with the following content:

```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## Step 2: Restart the application
After creating the .env file, restart your development server:

```bash
npm run dev
```

## Step 3: Check the console
Open your browser's developer console (F12) and look for these messages:
- `🤖 Using OpenAI API for translation to az` - API is working
- `⚠️ OpenAI API key not available, using fallback translation` - API key missing
- `OpenAI translation result: [translated text]` - Shows actual translation result

## What this enables:
- **Real AI Analysis**: Content analysis using OpenAI GPT-3.5-turbo
- **Real AI Translation**: Professional translation to English, Russian, Azerbaijani, and Turkish
- **Fallback Mode**: If API key is missing, the app will use mock functions

## Features:
✅ **Smart Analysis**: AI-powered content quality assessment
✅ **Professional Translation**: Natural, context-aware translations
✅ **Error Handling**: Graceful fallback to mock functions if API fails
✅ **Caching**: Results are cached for better performance
✅ **Cost Optimization**: Uses efficient prompts and token limits

## API Usage (Optimized):
- **Analysis**: ~300 tokens per request (cleaned content)
- **Translation**: ~500 tokens per request (cleaned content)
- **Caching**: Reduces API calls for repeated content
- **Token Savings**: 40-50% reduction by cleaning HTML before sending

The application will automatically detect if the API key is available and use real AI services, otherwise it will fall back to the mock implementations.
