# AI Text Summarization Platform

A production-minded AI SaaS starter for summarizing raw text and PDFs with a premium dashboard experience.

## What’s included

- Next.js frontend with Tailwind CSS, Framer Motion, dark/light mode, drag-and-drop uploads, export/copy/share actions, and responsive dashboard layouts
- Express API with JWT auth, PDF text extraction, OpenAI-powered summarization, keyword extraction, document chat, and summary history
- MongoDB support for persistence with an in-memory fallback when `MONGODB_URI` is not configured
- Multilingual output controls and structured summaries optimized for cards, bullets, and sections

## Architecture

```text
apps/web (Next.js UI)
    |
    v
apps/api (Express REST API)
    |
    +--> OpenAI Responses API for summarization/chat
    |
    +--> pdf-parse for document extraction
    |
    +--> MongoDB or in-memory storage for users + history
```

## Monorepo structure

```text
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── config
│   │   │   ├── lib
│   │   │   ├── middleware
│   │   │   ├── models
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   ├── types
│   │   │   └── utils
│   │   └── .env.example
│   └── web
│       ├── src
│       │   ├── app
│       │   ├── components
│       │   ├── lib
│       │   └── types
│       └── .env.local.example
├── docs
│   └── demo-video-script.md
└── README.md
```

## Features

- Text input and multi-PDF upload
- AI summarization with short, medium, and long output modes
- Multilingual summaries
- Keyword extraction
- “Chat with document” workflow
- User authentication with JWT cookies
- Saved summary history
- Copy, share, and export-to-PDF actions
- Dark/light theme toggle
- Responsive startup-style UI

## Environment setup

1. Copy `.env.example` values into:
   - `apps/api/.env`
   - `apps/web/.env.local`
2. Set `OPENAI_API_KEY` to use OpenAI-powered summarization.
3. Set `MONGODB_URI` to enable persistent auth/history storage, for example:
   `mongodb://localhost:27017/ai-summary`

## Install and run

```bash
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`

## Build for production

```bash
npm run build
```

## Deployment

Recommended production layout:

- `apps/web` deployed as the frontend
- `apps/api` deployed as the backend
- MongoDB Atlas for persistent storage
- A shared top-level domain such as `app.example.com` and `api.example.com`, or one domain with `/api` reverse-proxied to the backend

Why the shared domain matters:

- Auth uses HTTP-only cookies.
- In production the API sets cookies with `SameSite=None` and `Secure=true`.
- If you deploy the frontend and backend on unrelated domains such as `your-app.vercel.app` and `your-api.onrender.com`, some browsers may block login cookies.

### Production environment variables

API (`apps/api`):

```env
NODE_ENV=production
PORT=4000
CLIENT_URL=https://app.example.com
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5
JWT_SECRET=replace-with-a-long-random-secret
MONGODB_URI=your_mongodb_connection_string
AUTH_COOKIE_NAME=ai_summary_session
MAX_SOURCE_CHARS=120000
```

Web (`apps/web`):

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

If you place both apps behind the same domain with a reverse proxy, you can use:

```env
NEXT_PUBLIC_API_URL=/api
CLIENT_URL=https://yourdomain.com
```

### Example hosting setups

Option 1: Vercel + Render/Railway + MongoDB Atlas

1. Deploy `apps/web` to Vercel.
2. Deploy `apps/api` to Render or Railway as a Node web service.
3. Add a custom domain so the frontend and backend share the same root domain.
4. Set the environment variables above on both services.
5. Build commands:
   - Web: `npm run build --workspace @ai-summary/web`
   - API: `npm run build --workspace @ai-summary/api`
6. Start commands:
   - Web: `npm run start --workspace @ai-summary/web`
   - API: `npm run start --workspace @ai-summary/api`

Option 2: Single VPS with Nginx

1. Build both apps with `npm run build`.
2. Run the frontend with `npm run start --workspace @ai-summary/web`.
3. Run the API with `npm run start --workspace @ai-summary/api`.
4. Use Nginx to proxy:
   - `/` to the Next.js server
   - `/api` to the Express API
5. Set `NEXT_PUBLIC_API_URL=/api` so auth cookies stay first-party.

### Current repo note

- I removed an invalid `ignoreDeprecations` setting from `tsconfig.base.json`, because it was blocking the API production build.
- The build now gets past the TypeScript failure and into the Next.js production build phase in this environment.

## API overview

- `GET /api/health`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/summaries`
- `GET /api/summaries`
- `GET /api/summaries/:summaryId`
- `DELETE /api/summaries/:summaryId`
- `POST /api/summaries/chat`

## Notes on AI integration

- The backend is wired for the OpenAI Node SDK and the Responses API.
- If `OPENAI_API_KEY` is missing, the app still works in local fallback mode with heuristic summarization and document chat so the UI remains testable.
- `OPENAI_MODEL` defaults to `gpt-5`, but can be overridden via environment variables.

## Testing checklist

- Paste a short paragraph and generate a short summary
- Paste a long article and generate a long summary
- Upload one PDF and verify extracted content is summarized
- Upload multiple PDFs and verify combined summarization
- Test chat prompts against the current document
- Register/login and confirm summary history appears
- Try invalid input cases:
  - empty text + no file
  - non-PDF upload
  - missing API key
  - invalid auth credentials
