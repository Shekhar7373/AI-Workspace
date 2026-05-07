# AI Workspace Backend

Production-style Express backend for the AI Workspace blueprint.

## Features

- JWT auth with refresh token rotation
- Protected user profile
- PDF, DOCX, and TXT upload with Multer
- Groq-powered AI chat, reasoning, streaming, summaries, study planning, and agents
- Text extraction, chunking, local HuggingFace embeddings, and Qdrant storage
- Document Q&A, semantic search, coding assistant mode
- Redis short-term memory, MongoDB long-term memory, Qdrant vector memory
- Study tasks and AI study-plan generation
- AI agent endpoint
- Socket.IO streaming responses
- BullMQ document processing

## Manual Setup

1. Copy environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Fill `.env`:

```env
GROQ_API_KEY=your_groq_key
JWT_SECRET=use_a_long_random_secret
JWT_REFRESH_SECRET=use_another_long_random_secret
```

3. Start required services:

```bash
docker run -p 6333:6333 qdrant/qdrant
docker run -p 6379:6379 redis
```

MongoDB must be running locally, or set `MONGO_URI` to your MongoDB Atlas connection string.

The first semantic-search/RAG call downloads the HuggingFace embedding model, then runs embeddings locally on your machine. No paid embedding API is used.

If Qdrant already has old OpenAI-sized collections, delete these collections before uploading documents again:

- `document_chunks`
- `memory_vectors`
- `conversation_vectors`

4. Install and run:

```bash
npm install
npm run dev
```

Health check:

```http
GET http://localhost:5000/api/health
```

## Key Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `POST /api/documents/upload`
- `GET /api/documents`
- `POST /api/ai/chat`
- `POST /api/ai/ask-document`
- `POST /api/ai/generate-summary`
- `POST /api/ai/search`
- `GET /api/memory`
- `POST /api/memory/store`
- `POST /api/tasks`
- `GET /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/agents/run`
- `GET /api/dashboard`
