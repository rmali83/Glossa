# GlossaCAT AI Translation Features

## Overview
The GlossaCAT workspace now includes powerful AI-driven translation features that help translators work faster and more efficiently.

## Features

### 1. **Automatic Machine Translation (MT)**
- **Auto-fetch**: MT suggestions are automatically fetched when you navigate to a new segment
- **One-click apply**: Click the "AI Translate" button to instantly apply the MT suggestion
- **Multiple engines**: Uses MyMemory API with LibreTranslate as fallback
- **No API keys required**: All services are free and open-source

### 2. **AI-Powered Suggestions**
Located in the AI tab on the right panel:
- **Tone variations**: Generate translations in different tones:
  - Professional (default)
  - Casual/Informal
  - Formal/Academic
  - Marketing/Creative
- **Multiple alternatives**: Get several translation options to choose from
- **One-click apply**: Apply any suggestion directly to your segment

### 3. **Translation Memory Integration**
- Displays matches from your translation memory database
- Shows similarity percentage
- Click to apply previous translations

### 4. **Glossary Support**
- Automatically detects terms from your glossary
- Shows approved translations for consistency
- Click to insert terms into your translation

### 5. **Quality Checking**
Built-in quality checks include:
- Punctuation consistency
- Length discrepancy detection
- Untranslated text detection
- Quality score calculation

## How to Use

### Quick AI Translation
1. Navigate to a segment
2. Wait for MT suggestion to load (automatic)
3. Click "AI Translate" button to apply
4. Edit as needed
5. Click "Confirm & Next"

### Generate AI Suggestions
1. Click the "AI" tab in the right panel
2. Select your desired tone from the dropdown
3. Click "Generate Suggestions"
4. Review the alternatives
5. Click "Apply This Version" on your preferred option

### Using Translation Memory
1. Click the "TM / MT" tab
2. Review matches from your translation memory
3. Click on any match to apply it
4. The MT suggestion is also shown below TM matches

### Using Glossary
1. Click the "Glossary" tab
2. Review detected terms
3. Click the + button to insert a term
4. Terms are automatically highlighted in the source text

## Keyboard Shortcuts
- `Ctrl + Enter`: Confirm segment and move to next
- `Alt + ↑`: Previous segment
- `Alt + ↓`: Next segment
- `Ctrl + Shift + M`: Apply MT suggestion (coming soon)

## API Services Used

### MyMemory Translation API
- **Provider**: MyMemory (Translated.net)
- **Cost**: Free
- **Limit**: 1000 words/day (anonymous), 10,000 words/day (with email)
- **Languages**: 50+ language pairs
- **Quality**: Good for general content

### LibreTranslate (Fallback)
- **Provider**: LibreTranslate (Open Source)
- **Cost**: Free
- **Limit**: Rate-limited on public instance
- **Languages**: 30+ language pairs
- **Quality**: Good for basic translations

## Supported Languages
- English, Spanish, French, German, Italian, Portuguese
- Russian, Japanese, Korean, Chinese, Arabic
- Urdu, Hindi, Turkish, Dutch, Polish
- Swedish, Danish, Norwegian, Finnish
- And more...

## Tips for Best Results

1. **Review AI suggestions**: Always review and edit AI translations for accuracy
2. **Use glossary**: Add important terms to your glossary for consistency
3. **Build TM**: Confirmed translations are added to TM automatically
4. **Choose appropriate tone**: Select the tone that matches your content type
5. **Combine features**: Use MT as a starting point, then refine with glossary terms

## Future Enhancements
- Integration with premium MT engines (DeepL, Google Translate)
- Context-aware suggestions
- Custom AI models trained on your translation memory
- Real-time collaboration with AI assistance
- Advanced quality scoring with detailed feedback

## Troubleshooting

### MT not loading?
- Check your internet connection
- The API might be rate-limited (wait a few minutes)
- Try refreshing the page

### AI suggestions not generating?
- Ensure the source text is not empty
- Check that source and target languages are supported
- Try a different tone option

### Quality issues?
- AI translations are suggestions, not final translations
- Always review and edit for context, tone, and accuracy
- Use your professional judgment

## Support
For issues or feature requests, contact the development team or create an issue in the repository.
