# AI Workspace for Students and Developers

A full-stack AI productivity workspace built for students, developers, and self-learners. The platform combines AI chat, document intelligence, semantic search, memory, study planning, coding assistance, workflow automation, and external integrations into one modern web application.

This project is designed as a production-style MERN application with a React frontend, Express backend, MongoDB persistence, Redis caching/queues, Qdrant vector search, Socket.IO realtime updates, local HuggingFace embeddings, and Groq-powered AI responses.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Usage Guide](#usage-guide)
- [Future Scope](#future-scope)
- [License](#license)

## Overview

AI Workspace is more than a basic chatbot. It is an AI-assisted knowledge and productivity system where users can:

- Chat with an AI assistant in realtime.
- Upload documents and ask questions about their content.
- Search notes and uploaded material semantically.
- Store user preferences, memories, learning patterns, and useful context.
- Generate study plans and manage tasks.
- Use a coding assistant for debugging, explanation, and code generation.
- Run AI agents and workflow tools.
- Connect external services such as Google/Gmail and Telegram.

The goal is to create a unified workspace inspired by tools like Notion AI, ChatGPT, Obsidian, Lindy, and GitHub Copilot.

## Features

### Authentication

- User registration and login
- JWT access tokens
- Refresh token support
- Protected API routes
- Authenticated frontend routes

### AI Chat

- Context-aware AI chat
- Socket.IO streaming support
- Persistent conversations
- Markdown-friendly responses
- Coding and learning assistance

### Document Intelligence

- Upload PDF, DOCX, and TXT files
- Extract and clean document text
- Split content into chunks
- Generate local embeddings with HuggingFace Transformers
- Store document vectors in Qdrant
- Ask AI questions based on uploaded documents

### Semantic Search

- Meaning-based search instead of simple keyword search
- Qdrant-powered vector retrieval
- Search across uploaded document chunks and stored AI memory

### AI Memory

- Short-term memory through Redis
- Long-term memory through MongoDB
- Vector memory through Qdrant
- Stores preferences, useful facts, study habits, and recurring context

### Study Planner and Tasks

- Create and manage study tasks
- Track task priority, deadline, and status
- Generate AI-assisted study plans
- View progress through the dashboard

### Coding Assistant

- Explain code
- Debug errors
- Generate snippets
- Help with JavaScript, Python, Java, C++, and general programming concepts

### Agents and Workflows

- AI agent execution endpoints
- Tool registry and tool executor structure
- Local workflow service
- Workflow routes and controllers

### Integrations

- Google OAuth support
- Gmail service layer
- Telegram bot interface and webhook support

### Dashboard

- Central workspace overview
- Recent documents
- Pending tasks
- AI insights
- Memory highlights
- Quick navigation to major tools

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Zustand
- Socket.IO Client
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Redis
- BullMQ
- Socket.IO
- Multer

### AI and Vector Stack

- Groq SDK
- Groq chat model: `llama-3.3-70b-versatile`
- HuggingFace Transformers
- Local embedding model: `Xenova/all-MiniLM-L6-v2`
- Qdrant Vector Database

## Project Structure

```text
.
+-- backend/
|   +-- src/
|   |   +-- ai/
|   |   |   +-- agents/
|   |   |   +-- embeddings/
|   |   |   +-- prompts/
|   |   |   +-- rag/
|   |   |   +-- tools/
|   |   |   +-- workflows/
|   |   +-- config/
|   |   +-- controllers/
|   |   +-- interfaces/
|   |   +-- jobs/
|   |   +-- middlewares/
|   |   +-- models/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- sockets/
|   |   +-- utils/
|   |   +-- app.js
|   |   +-- server.js
|   +-- .env.example
|   +-- package.json
|
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- layouts/
|   |   +-- pages/
|   |   +-- services/
|   |   +-- store/
|   |   +-- utils/
|   |   +-- App.jsx
|   |   +-- main.jsx
|   |   +-- styles.css
|   +-- .env.example
|   +-- package.json
|
+-- readme.md
+-- .gitignore
```

## Architecture

```text
React Frontend
    |
    | REST API + Socket.IO
    v
Express Backend
    |
    |-- Auth Service
    |-- AI Service
    |-- Document Service
    |-- Memory Service
    |-- Task Service
    |-- Agent Service
    |-- Workflow Service
    |-- Integration Services
    |
    |-- MongoDB: users, documents, chats, tasks, memories
    |-- Redis: cache, short-term memory, queues
    |-- Qdrant: vector search for documents and memory
    |-- Groq: AI chat and reasoning
    |-- HuggingFace Transformers: local embeddings
```

## Prerequisites

Install the following before running the project:

- Node.js 18 or later
- npm
- MongoDB local server or MongoDB Atlas account
- Docker Desktop
- Git
- Groq API key

Optional, depending on the integrations you want to use:

- Google Cloud OAuth credentials
- Telegram bot token
- ngrok or another public tunnel for Telegram webhook testing

## Environment Variables

### Backend

Create a backend environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

Update `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173,http://localhost:5174

MONGO_URI=mongodb://127.0.0.1:27017/ai_workspace
JWT_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=50m
REFRESH_TOKEN_EXPIRES_IN=7d

GROQ_API_KEY=your_groq_api_key
GROQ_CHAT_MODEL=llama-3.3-70b-versatile

HF_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
HF_EMBEDDING_DIMENSION=384

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
REDIS_URL=redis://localhost:6379

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=change_this_long_random_secret

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=change_this_random_webhook_secret
TELEGRAM_WEBHOOK_URL=https://your-ngrok-domain.ngrok-free.app/api/telegram/webhook
TELEGRAM_LINK_CODE_TTL_MINUTES=10
TELEGRAM_RATE_LIMIT_WINDOW_MS=60000
TELEGRAM_RATE_LIMIT_MAX=20
```

### Frontend

Create a frontend environment file:

```powershell
cd frontend
Copy-Item .env.example .env
```

Update `frontend/.env` if your backend URL is different:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Installation and Setup

Clone the repository:

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Start Qdrant:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Start Redis:

```bash
docker run -p 6379:6379 redis
```

Make sure MongoDB is running locally or update `MONGO_URI` with your MongoDB Atlas connection string.

## Running the Application

Start the backend:

```bash
cd backend
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## API Overview

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

### Documents

```text
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
```

### AI

```text
POST /api/ai/chat
POST /api/ai/ask-document
POST /api/ai/generate-summary
POST /api/ai/search
```

### Memory

```text
GET  /api/memory
POST /api/memory/store
```

### Tasks

```text
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Agents, Dashboard, Workflows, Integrations

```text
POST /api/agents/run
GET  /api/dashboard
```

Additional backend route groups are available under:

```text
/api/workflows
/api/integrations
/api/telegram
```

## Usage Guide

1. Register a new account from the frontend.
2. Log in to access the protected workspace.
3. Open the dashboard to view recent activity, tasks, documents, and AI insights.
4. Use AI Chat for general learning, reasoning, and development help.
5. Upload PDF, DOCX, or TXT documents from the Documents page.
6. Ask document-specific questions after upload and processing.
7. Use Semantic Search to find related information by meaning.
8. Create tasks and generate study plans from the Study Planner and Tasks pages.
9. Use the Coding Assistant for debugging, explanations, and code snippets.
10. Store important context in Memory so future AI responses can become more personalized.
11. Configure optional Google/Gmail and Telegram integrations if needed.

## Notes

- The first document upload or semantic-search operation may take longer because the local HuggingFace embedding model is downloaded.
- Embeddings are generated locally; a paid embedding API is not required.
- If Qdrant collections were created with a different embedding dimension, delete and recreate the collections before uploading new documents.
- Keep `.env` files private and never commit API keys or secrets.

## Future Scope

- Voice-based AI interaction
- OCR for scanned documents and images
- Browser extension
- Mobile application
- Collaborative workspaces
- AI whiteboard
- Offline/local model support
- More workflow tools and external app integrations

## License

This project is currently intended for academic and learning purposes. Add a license file before using or distributing it publicly.
