# Drill-Chat

> **Changing the depth of conversation** — Select specific parts of an AI answer to open inline sub-conversations and sync the results back into the original response.

## 🔍 What is Drill-Chat?

Every AI chat interface today operates as a **linear, one-dimensional stream**:

```
[Question] → [Answer] → [Question] → [Answer] → ...
```

Drill-Chat transforms this structure into an **explorable tree**:

```
[Question] → [Answer Tree] → [Partial Exploration] → [Sync-back] → [Complete Knowledge]
```

## ✨ Core Features

- **Inline Sub-Conversations** — Click or drag-select specific items within an answer to open a sub-conversation and explore in depth.
- **Surgical Sync-back** — Automatically integrate insights from sub-conversations back into the original answer. Instead of fully regenerating the AI's original answer, it surgically rewrites only the targeted section using a markdown boundary parser, reducing output tokens by up to **~75%**.
- **Multi-LLM Support** — Supports OpenAI GPT-4o, Anthropic Claude, and Google Gemini.
- **Tree-structured Conversations** — Manage conversations as tree structures to prevent context loss.

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| LLM Integration | Vercel AI SDK |
| State Management | Zustand |
| Deployment | Vercel |

## 🚀 Getting Started

```bash
cd drill-chat
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

Create a `.env.local` file with your API keys:

```env
# At least one provider is required
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

## 📖 Documentation

- [CONCEPT.md](./docs/sub_tasker_concept.md) — Detailed concept document
- [ROADMAP.md](./docs/drill_chat_roadmap.md) — Development roadmap

## 📄 License

[MIT License](./drill-chat/LICENSE) — See [LICENSE](./drill-chat/LICENSE) for details.

---

*Drill-Chat — Inline sub-conversations with sync-back for AI chat interfaces*
