# Menu OCR

Transform paper menus into beautiful digital experiences. Upload an image, extract menu items with AI, customize the design, and publish a shareable menu with QR code.

## Features

- **AI-Powered OCR** - Extract menu items automatically using Tesseract.js
- **LLM Parsing** - Groq API structures messy OCR text into clean menu data
- **Visual Editor** - Drag-drop interface to edit and organize menu items
- **Templates** - Minimal, Dark, and Photo-heavy designs
- **QR Codes** - Instant generation for easy sharing
- **Mobile-First** - All menus look great on phones

## Project Structure

```
menu-ocr/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Cloudflare Worker backend
├── packages/
│   └── shared/       # Shared TypeScript types
└── package.json      # Workspace root
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Groq API key (free tier available)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cd apps/api
# Add your Groq API key
wrangler secret put GROQ_API_KEY
```

3. **Run locally:**
```bash
# Terminal 1 - Start API
cd apps/api
npm run dev

# Terminal 2 - Start web app
cd apps/web
npm run dev
```

4. **Open** http://localhost:5173

## Development

### Frontend (apps/web)

```bash
cd apps/web
npm install
npm run dev
```

- React + TypeScript + Vite
- Tailwind CSS for styling
- Tesseract.js for OCR (runs in browser)
- Zustand for state management

### Backend (apps/api)

```bash
cd apps/api
npm install
npm run dev
```

- Cloudflare Workers (edge-deployed)
- Groq API for LLM parsing
- KV storage for menus
- QR code generation

### API Endpoints

- `POST /api/parse-menu` - Parse OCR text into structured menu
- `GET /api/menu/:id` - Get menu by ID
- `POST /api/menu` - Create new menu
- `PUT /api/menu/:id` - Update menu
- `GET /api/qr?url=...` - Generate QR code

## Deployment

### Web (Vercel/Netlify)

```bash
cd apps/web
npm run build
# Deploy dist/ folder
```

### API (Cloudflare)

```bash
cd apps/api
npm run deploy
```

## Testing

### Run All Tests

```bash
# Unit tests for frontend and API
npm run test

# E2E tests with Playwright
npm run test:e2e

# Integration tests for API
npm run test:integration
```

### Frontend Tests (apps/web)

```bash
cd apps/web
npm run test              # Unit tests with Vitest
npm run test:watch        # Watch mode
npm run test:e2e          # E2E with Playwright
npm run test:e2e:ui       # E2E with UI
```

Test coverage includes:
- **Components**: FileUpload, OCRProcessor, MenuEditor, QRCodeDisplay
- **Store**: Menu state management, CRUD operations
- **E2E**: Full user flow from upload to publish

### API Tests (apps/api)

```bash
cd apps/api
npm run test              # Unit/integration tests
npm run test:integration  # Integration tests only
```

Test coverage includes:
- **Endpoints**: All API routes with mocked KV storage
- **CORS**: Cross-origin request handling
- **Error handling**: 404s, validation errors, fallback parsing

## Flow

1. User uploads image/PDF
2. Tesseract.js extracts text in browser
3. Text sent to `/api/parse-menu`
4. Groq LLM extracts items, prices, categories
5. Visual editor shows parsed data for correction
6. User selects template and publishes
7. QR code generated, public URL created

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Tesseract.js, Zustand
- **Backend:** Cloudflare Workers, Groq API
- **Storage:** Cloudflare KV (production), localStorage (dev)
- **OCR:** Tesseract.js (client-side)

## License

MIT
