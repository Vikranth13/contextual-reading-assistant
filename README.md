# Contextual Reading Assistant

A Chrome extension that helps users understand unfamiliar words without leaving the webpage they are reading.

Select a word on any webpage to view its definition, part of speech, phonetic pronunciation, and an AI-generated explanation of what the word means in that specific sentence.

The project combines a Chrome Manifest V3 extension with a FastAPI backend, Gemini through LangChain, Redis caching, and local vocabulary storage.

---

## Features

- Single-word selection directly on webpages
- Floating contextual lookup popup
- Dictionary definition and part of speech
- Phonetic pronunciation
- AI-generated contextual meaning
- Free Dictionary API with Datamuse fallback
- Redis caching for repeated AI requests
- Redis-backed rate limiting
- Save vocabulary locally
- Saved Words page
- Configurable AI explanations and phonetic display
- Graceful handling of dictionary, Redis, and AI failures
- Prompt-injection safeguards
- Keyboard and accessibility support

---

## How It Works

```text
Web Page
   ↓
Content Script
   ↓
Chrome Service Worker
   ├── Free Dictionary API
   ├── Datamuse fallback
   │
   └── FastAPI Backend
           ↓
         Redis
        /     \
      HIT     MISS
       │        ↓
       │     LangChain
       │        ↓
       │      Gemini
       └────────┘
           ↓
       Popup Result

Saved Vocabulary
      ↓
chrome.storage.local
      ↓
Saved Words Page
```

The dictionary provides a deterministic definition, while Gemini explains what the selected word means in the surrounding sentence.

Only the selected word and surrounding sentence are sent to the AI backend.

---

## Tech Stack

### Extension
- TypeScript
- React
- Vite
- Chrome Manifest V3
- CRXJS
- Chrome Runtime Messaging
- Chrome Storage API
- Shadow DOM

### Backend
- Python
- FastAPI
- Pydantic
- LangChain
- Gemini
- Redis

### Testing
- Pytest
- Vitest
- jsdom

---

## Project Structure

```text
contextual-reading-assistant/
│
├── backend/
│   ├── app/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── main.py
│   │   └── models.py
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
│
├── extension/
│   ├── src/
│   │   ├── api/
│   │   ├── background/
│   │   ├── components/
│   │   ├── content/
│   │   ├── saved/
│   │   ├── storage/
│   │   └── types/
│   ├── manifest.config.ts
│   ├── saved.html
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md
```

---

## Setup

### Prerequisites

Install:

- Python 3
- Node.js and npm
- Docker Desktop
- Google Chrome
- Git

You will also need a Gemini API key.

---

### 1. Backend

```cmd
cd backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy:

```text
.env.example
```

to:

```text
.env
```

and configure:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

REDIS_URL=redis://127.0.0.1:6379/0
EXPLANATION_CACHE_TTL_SECONDS=86400

RATE_LIMIT_REQUESTS=30
RATE_LIMIT_WINDOW_SECONDS=60
```

Start Redis:

```cmd
docker run --name contextual-reading-redis -p 6379:6379 -d redis:7-alpine
```

If the container already exists:

```cmd
docker start contextual-reading-redis
```

Start FastAPI:

```cmd
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

### 2. Extension

Open another terminal:

```cmd
cd extension
npm install
npm run build
```

Open:

```text
chrome://extensions
```

Then:

1. Enable Developer mode
2. Click **Load unpacked**
3. Select:

```text
extension/dist
```

After changing extension code:

```cmd
npm run build
```

then reload the extension in Chrome.

---

## Usage

1. Open a webpage.
2. Select a single word.
3. Click the floating `✦` button.
4. View the dictionary definition.
5. View the AI-generated contextual explanation.
6. Save the word if desired.
7. Open **Saved words** to review saved vocabulary.

---

## Example

The same word can have different meanings depending on context.

```text
The dashing officer entered the ballroom.
```

Here, `dashing` means stylish or attractive.

```text
The child was dashing across the street.
```

Here, `dashing` means moving quickly.

This context-sensitive interpretation is the main purpose of the AI component.

---

## Reliability and Privacy

The application is designed so one failing dependency does not break the entire experience.

- Free Dictionary falls back to Datamuse
- Redis failures bypass the cache and continue to Gemini
- AI backend failures do not break dictionary lookup
- Invalid words do not trigger unnecessary AI requests
- Saved vocabulary remains in `chrome.storage.local`

The AI backend receives only:

```text
selected word
+
surrounding sentence
```

It does not receive the full webpage, browsing history, cookies, or saved vocabulary.

API keys remain on the FastAPI backend and are never bundled into the Chrome extension.

---

## Testing

Backend:

```cmd
cd backend
pytest -q
```

Extension:

```cmd
cd extension
npm run test
npm run lint
npm run build
```

---

## MVP Scope

Included:

- contextual dictionary lookup
- sentence extraction
- AI contextual explanations
- dictionary provider fallback
- Redis caching
- rate limiting
- saved vocabulary
- Saved Words page
- basic settings
- validation and error handling
- automated tests

Intentionally out of scope:

- user accounts
- cloud synchronization
- full-page summarization
- chatbot functionality
- translation
- RAG
- flashcards and quizzes
- mobile support
- analytics

---

## Future Improvements

Possible next steps include:

- cloud deployment
- managed Redis
- Chrome Web Store packaging
- vocabulary export
- spaced-repetition flashcards
- end-to-end browser testing
- improved onboarding and settings UI

---

## Project Goal

The project is intentionally focused on one core experience:

> Understand an unfamiliar word without leaving what you are reading.