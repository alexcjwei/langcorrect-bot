# LangCorrect Bot

A Chrome extension that generates corrections for journal entries on the [LangCorrect](https://langcorrect.com) language learning platform using AI.

## Overview

LangCorrect is a peer-correction platform where language learners write journals and receive feedback from native speakers. Users must maintain a correction ratio (corrections given / sentences written) above 1.0 to post their own entries. This extension automates the correction process by generating feedback using Claude or GPT-4, then auto-filling the correction form.

## Setup and Installation

### Prerequisites
- Chrome or Chromium-based browser
- API key from [Anthropic](https://console.anthropic.com) or [OpenAI](https://platform.openai.com/api-keys)

### Installation Steps

1. **Clone and prepare the extension:**
   ```bash
   git clone https://github.com/yourusername/langcorrect-bot.git
   cd langcorrect-bot
   ```

2. **Load the extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/` directory from this repository

3. **Configure your API key:**
   - Click the extension icon in Chrome's toolbar
   - Click the settings icon
   - Select your AI provider (Anthropic or OpenAI)
   - Paste your API key and save

### Usage

1. Navigate to a LangCorrect correction page: `https://langcorrect.com/journals/*/make_corrections`
2. Click the extension icon
3. Review the sentence count and click "Correct"
4. Wait for the AI to generate corrections and auto-fill the form
5. Review suggestions and make edits if needed
6. Submit the form

## Architecture

**Extension Structure:**
- `manifest.json` - Extension configuration (Manifest V3)
- `popup.html/js` - UI and user interaction
- `options.html/js` - Settings and API key configuration
- `content.js` - Content script for page interaction
- `background.js` - Service worker for API calls (handles CORS)

**Core Modules:**
- `src/api.js` - Anthropic and OpenAI API wrappers
- `src/parser.js` - Prompt construction and response parsing
- `src/dom.js` - DOM extraction and form auto-fill logic

**Testing:**
- `tests/parser.test.js` - Prompt/response logic
- `tests/dom.test.js` - DOM extraction and form filling (JSDOM-based)
- `tests/api.integration.test.js` - Real API integration tests

## Tech Stack

- **JavaScript** (ES modules)
- **Testing:** Vitest, JSDOM, Chai
- **APIs:** Anthropic Claude, OpenAI GPT
- **Storage:** Chrome sync storage

## Development

```bash
npm install
npm test                   # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests (requires .env with API keys)
```

### Test-Driven Approach

Tests are written before implementation. All tests use real behavior validation (no mock-only tests) and must pass with an actual implementation. See `CLAUDE.md` for development workflow details.

## Documentation

- `docs/correction-form-walkthrough.md` - Detailed breakdown of the LangCorrect correction form HTML structure
- `CLAUDE.md` - Development workflow and coding standards
