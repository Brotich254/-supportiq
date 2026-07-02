# ⚡ SupportIQ — AI Customer Support Platform

> Multi-tenant SaaS that resolves 80% of support tickets automatically using GPT-4o + pgvector semantic search. One script tag to embed on any website.

## 🏗 Architecture

```
Customer's Website
  └── <script src="supportiq.ai/embed.js" data-key="KEY">
        └── Loads iframe → /widget (hosted on SupportIQ)
              └── POST /api/chat (with API key)
                    └── pgvector semantic search → relevant docs
                          └── GPT-4o-mini generates response
                                └── auto-escalates complex issues → ticket
                                      └── Agent replies in dashboard
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, full-stack) |
| Database | PostgreSQL + pgvector (semantic search) |
| ORM | Prisma |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| Cache | Upstash Redis |
| Auth | NextAuth.js (credentials + JWT) |
| UI | Tailwind CSS |
| Deploy | Vercel + Supabase/Neon |

## 📁 Key Files

```
supportiq/
├── app/
│   ├── (auth)/login, register       ← Auth pages
│   ├── (dashboard)/dashboard/       ← Agent dashboard
│   │   ├── page.tsx                 ← Stats overview
│   │   ├── tickets/                 ← Ticket inbox + detail
│   │   ├── knowledge/               ← Train the AI
│   │   └── settings/                ← Widget config + API key
│   ├── widget/page.tsx              ← Embeddable chat UI (iframe)
│   └── api/
│       ├── chat/route.ts            ← Core AI chat endpoint
│       ├── tickets/                 ← Ticket CRUD + agent replies
│       ├── knowledge/               ← Knowledge base (embeddings)
│       ├── settings/                ← Org settings
│       └── widget/config/           ← Public widget config
├── lib/
│   ├── ai.ts                        ← OpenAI + pgvector search
│   ├── auth.ts                      ← NextAuth config
│   └── db.ts                        ← Prisma client
├── public/embed.js                  ← The script tag customers add
├── prisma/schema.prisma             ← Multi-tenant data model
└── docker-compose.yml               ← Local Postgres + Redis
```

## 🗄 Database Schema

- **Organization** — each tenant, has `apiKey`, `widgetColor`, `greeting`
- **User** — agents/admins, linked to orgs via `OrgMember`
- **KnowledgeDoc** — training docs with `pgvector` embeddings for semantic search
- **Conversation** — visitor chat session, status: BOT → ESCALATED → OPEN → RESOLVED
- **Message** — individual messages (VISITOR / AI / AGENT / SYSTEM roles)
- **Ticket** — created on escalation, assigned to agents

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker (for local Postgres + Redis)
- OpenAI API key

### Installation

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/supportiq.git
   cd supportiq
   npm install
   ```

2. Start local services:
   ```bash
   docker-compose up -d
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Fill in OPENAI_API_KEY, NEXTAUTH_SECRET
   # DATABASE_URL is already set for docker-compose
   ```

4. Set up database with pgvector:
   ```bash
   npx prisma db push
   ```

5. Start the app:
   ```bash
   npm run dev
   ```

Open `http://localhost:3000`, register, and you'll get an API key automatically.

### Embedding the Widget

After registering, go to **Settings** and copy your embed snippet:

```html
<script src="http://localhost:3000/embed.js"
  data-key="siq_your_api_key_here">
</script>
```

Paste it before `</body>` on any website.

### Training the AI

1. Go to **Knowledge Base** in the dashboard
2. Click **Add Document**
3. Paste your FAQ, product docs, or policy text
4. Click **Save & Index** — the AI immediately uses it for answers

## ✨ Features

- **AI Chat Widget** — embeddable on any website via one script tag
- **Semantic Search** — pgvector finds the most relevant docs for each question (cosine similarity)
- **Auto-escalation** — AI detects when it can't help and creates a ticket automatically
- **Ticket Inbox** — agents see all open tickets with conversation history
- **Agent Replies** — agents reply directly in the ticket detail view
- **Knowledge Base** — add/delete/update training documents with live re-indexing
- **Widget Customization** — change color and greeting message
- **Multi-tenant** — each organization gets isolated data and their own API key
- **Bot Resolution Rate** — dashboard shows what % of conversations the AI resolved

## 📈 Scale Path

| Users | Infrastructure |
|-------|---------------|
| MVP | Vercel + Supabase (free tier) |
| 10K convs/month | Vercel Pro + Supabase Pro |
| 100K convs/month | Add Redis caching, pgvector index tuning |
| 1M+ convs/month | Separate chat service, BullMQ job queue, Pinecone for vectors |

## 🔑 API Reference

All widget endpoints use `x-api-key` header for authentication.
All dashboard endpoints use NextAuth session cookie.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/chat` | API Key | Send message, get AI response |
| `GET /api/chat?conversationId=` | API Key | Load conversation history |
| `GET /api/widget/config` | API Key | Widget color/greeting config |
| `GET /api/tickets` | Session | List tickets (filterable) |
| `GET /api/tickets/:id` | Session | Ticket + full conversation |
| `PATCH /api/tickets/:id` | Session | Update status/priority/assignee |
| `POST /api/tickets/:id` | Session | Agent reply |
| `GET /api/knowledge` | Session | List knowledge docs |
| `POST /api/knowledge` | Session | Add doc + generate embedding |
| `DELETE /api/knowledge/:id` | Session | Remove doc |
| `GET /api/settings` | Session | Get org settings |
| `PATCH /api/settings` | Session | Update greeting/color |

## 📄 License

MIT
# -supportiq
