# Drill-Chat — Strategic Roadmap

> **"Don't try to protect the idea — claim it through execution."**

---

## Why This Roadmap?

Drill-Chat's core value is **UX innovation**. We're not building an LLM — we're changing the structure of AI conversations.
Given this nature, the following three strategic decisions form the foundation of this roadmap:

### Strategic Decision ①: Don't Submit a PR Right Away

| Immediate PR | Demo First |
|-------------|------------|
| "Nice idea 👍" → issue opened and forgotten | "I tried this and it's actually great" → pressure to accept PR |
| Maintainer has to bear the implementation cost | Already working code reduces integration burden |
| LibreChat #9393 has already gone down this path | Community response is proof of demand |

### Strategic Decision ②: Build as an "LLM API Wrapper", Not a Standalone App

- No custom LLM — **connect GPT-4, Claude, Gemini APIs** for instant high-quality answers
- Drill-Chat is a **UX layer**, so the LLM is a replaceable backend
- Open WebUI, LibreChat, LobeChat all use this approach (API wrapper + custom UI)
- **Prototype = usable product** → no need for a separate demo app

### Strategic Decision ③: Git History Is the Proof of Priority

- UX ideas cannot be protected by patents or copyright
- **GitHub commit history permanently records implementation timestamps**
- Publishing as open-source transparently proves "who built it first"
- Fast execution is the best protection strategy

---

## Phase 0: Preparation (1-2 days)

> **Goal**: Establish the project's public presence and record a priority timestamp before development begins.

### 0-1. GitHub Repository Creation

```
drill-chat/
├── README.md          ← Concept + demo GIF (updated after Phase 1)
├── LICENSE            ← MIT License
├── CONCEPT.md         ← Concept document (based on sub_tasker_concept.md)
├── ROADMAP.md         ← This document
├── package.json
└── src/
```

**Why MIT License?**
- Most permissive license → easy for other open-source projects to adopt the code
- No license conflicts when contributing PRs
- Aligns with the "take it, but we're the original" strategy

### 0-2. First Commit: Concept Documents

- Push CONCEPT.md and ROADMAP.md as the **first commit**
- This commit becomes the **official timestamp of the idea**
- Commit message: `Initial commit: Drill-Chat concept and roadmap`

### 0-3. Completion Criteria

- [x] Create public GitHub repository
- [x] Apply MIT License
- [x] Commit CONCEPT.md and ROADMAP.md
- [x] Repository Description: "Drill-Chat: Inline sub-conversations with sync-back for AI chat interfaces"

---

## Phase 1: Prototype Development (2 weeks)

> **Goal**: Build a web app where Drill-Chat's core UX actually works. This is both the demo and the product.

### 1-1. Tech Stack Decisions

| Category | Choice | Reason |
|----------|--------|--------|
| **Framework** | Next.js (App Router) | SSR/SSG capable, free Vercel deployment, React ecosystem |
| **Styling** | Tailwind CSS + shadcn/ui | Fast development, dark mode by default, premium UI |
| **LLM API** | OpenAI GPT-4o (primary), Anthropic Claude (secondary) | Most versatile, streaming support |
| **State Management** | Zustand or Jotai | Suitable for tree-structured conversation state, lightweight |
| **Deployment** | Vercel | Next.js optimized, free tier, custom domain |
| **Domain** | drill-chat.com or drillchat.dev | (TBD) |

**Why Next.js?**
- Among LibreChat (React), LobeChat (Next.js), Open WebUI (Svelte), Next.js is the most versatile
- Code can be easily ported to React-based projects (LibreChat, LobeChat) for future PRs
- Vercel deployment enables instant live demo sharing

### 1-2. Development Order

#### Week 1: Foundation + Basic Chat

**Day 1-2: Project Setup & Basic Chat UI**
- Initialize Next.js project
- Implement basic chat interface (message list, input field, streaming response)
- Integrate OpenAI API (streaming)
- Dark mode default, premium UI design
- At this stage, it's a standard ChatGPT clone

**Day 3-4: Tree-structured Data Model + Answer Parsing**
- Implement state model for managing conversations as a tree:

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subConversations: SubConversation[];
}

interface SubConversation {
  id: string;
  anchorText: string;
  anchorRange: { start: number; end: number };
  messages: Message[];
  status: 'active' | 'completed' | 'synced';
}
```

- Parse structured items (numbered lists, headings) from AI answers to create interaction points
- Display "🔍" icon or "Learn more" button on hover for each item

**Day 5: Text Selection-based Sub-conversation Trigger**
- Show popover menu on answer text drag-select
- Provide "Open Drill-Chat" option
- Create sub-conversation with selected text as anchor

#### Week 2: Sub-conversation + Sync-back (Core)

**Day 6-7: Sub-conversation Panel UI**
- Implement as bottom modal panel (v1)
  - Why bottom modal? → View main conversation while asking sub-questions, easier mobile support
- Support multi-turn Q&A within sub-conversation
- Include full root answer + anchor text in sub-conversation context

**Day 8-9: Sync-back Feature (Killer Feature)**
- Implement "Sync to full answer" button
- On click, send the following prompt to AI:

```
[System Prompt]
Below is the original answer and a sub-conversation the user had about "{anchorText}".
Integrate the information from the sub-conversation into the relevant item of the original answer
and update the full answer.

[Original Answer]
{rootAnswer}

[Sub-conversation Content]
{subConversationHistory}
```

- Replace root answer with AI-generated updated answer
- Diff highlight on replacement (visual indicator of what changed)
- Preserve sub-conversation history as collapsible section under the item

**Day 10: Polish & Edge Cases**
- Support multiple simultaneous sub-conversations (e.g., items 1 and 3 each having sub-conversations)
- Collapse/expand sub-conversations
- Responsive design (mobile support)
- Error handling, loading states
- Update README: record and attach demo GIF

### 1-3. Phase 1 Completion Criteria

- [ ] Basic AI chat works (GPT-4o streaming)
- [ ] Select item in AI answer → sub-conversation panel opens
- [ ] Text drag → sub-conversation trigger
- [ ] Multi-turn Q&A within sub-conversation
- [ ] "Sync to full answer" (Sync-back) works
- [ ] Vercel live deployment
- [ ] README includes demo GIF

### 1-4. Decision Point

> [!IMPORTANT]
> Self-evaluation after Phase 1: **"When I use it myself, is there a clear moment where it's better than existing ChatGPT?"**
> - Yes → Proceed to Phase 2
> - No → Improve UX and re-evaluate

---

## Phase 2: Demo Deployment & Community Validation (1 week)

> **Goal**: Prove demand through community response. The persuasive power of the PR comes from here.

### 2-1. Demo Materials Preparation

**Demo GIF/Video Production** (Most Important)
- 30-second GIF: Core flow (Question → Answer → Drill-down → Sub Q&A → Sync-back)
- 2-minute video: Real usage scenario + Before/After comparison

**Before/After Comparison**
```
[Before - Standard ChatGPT]
Q: How to start a franchise?
A: 1. Business registration 2. Franchise application 3. Find location...
Q: Tell me more about #2
A: Franchise application involves... (flows separately from original answer)
Q: What about #3 from the full answer?
A: (Lost context or needs to re-explain)

[After - Drill-Chat]
Q: How to start a franchise?
A: 1. Business registration 2. Franchise application 3. Find location...
   → Drill down on #2 → Sub-conversation → Sync
A: 1. Business registration 2. Franchise application ★Enhanced★ 3. Find location...
   (One complete, enriched answer)
```

### 2-2. Promotion Channels & Strategy

| Channel | Strategy | Timing |
|---------|----------|--------|
| **Reddit r/ChatGPT** | "I built a ChatGPT wrapper that lets you drill into specific parts of an answer" | Day 1 |
| **Reddit r/LocalLLaMA** | Tech-focused, "Tree-structured conversations with sync-back" | Day 1 |
| **Reddit r/artificial** | Broader AI community | Day 2 |
| **𝕏 (Twitter)** | Demo GIF + one-line summary, tag AI/developer influencers | Day 1 |
| **Hacker News** | "Show HN: Drill-Chat – Inline sub-conversations for AI chat" | Day 3 (weekday morning) |
| **Product Hunt** | Official launch (consider after Phase 3) | On hold |

**Why this order?**
- Test response on Reddit/𝕏 first, then post to HN if response is good
- HN can only be posted once, so deploy at optimal timing
- Product Hunt when there's enough polish (after Phase 3)

### 2-3. Post Title/Body Draft

**Reddit Title (English)**:
> "I built a ChatGPT wrapper where you can drill into any part of an AI answer, have a sub-conversation about it, and sync the results back into the original response."

**Key Messages**:
- Problem: AI conversations are linear — drilling into a specific part of an answer loses overall context
- Solution: Click items in the answer to open inline sub-conversations → sync results back to the original
- Difference from existing "branching": Not a Fork, but Drill-down + Merge

### 2-4. Phase 2 Completion Criteria & Success Metrics

| Metric | Minimum Target | Success Target |
|--------|---------------|----------------|
| GitHub Stars | 50+ | 200+ |
| Reddit Upvotes (combined) | 100+ | 500+ |
| Live demo visitors | 500+ | 2000+ |
| Meaningful feedback/issues | 5+ | 20+ |
| HN points | 30+ | 100+ |

### 2-5. Decision Point

> [!IMPORTANT]
> Branching after Phase 2:
> - **Hot response** (Stars 200+, HN 100+) → Phase 3A: Grow as independent project + selective PR
> - **Moderate response** (Stars 50-200) → Phase 3B: Focus on open-source PRs (with validated demo)
> - **Minimal response** (Stars under 50) → Consider UX redesign or pivot

---

## Phase 3: Open-Source Expansion (2+ weeks)

> **Goal**: Spread the validated UX to the broader ecosystem.

### 3A. Independent Project Growth Path (If Response Is Hot)

**npm Library Publication**
- Extract Drill-Chat's core UI components into an independent package
- `@drill-chat/react` — React components that can be attached to any AI chat app
- Used in own project and importable by other projects

```bash
npm install @drill-chat/react
```

```tsx
import { DrillChatProvider, DrillableMessage, SubConversation } from '@drill-chat/react';
```

**Product Hunt Launch**
- Full launch combining demo + community response + GIF/video

### 3B. Open-Source PR Path (Parallelizable Regardless)

**PR Priority**

| Priority | Project | Reason | Difficulty |
|----------|---------|--------|------------|
| 1 | **LibreChat** | Issue #9393 already open → "I implemented it" | ⭐⭐ |
| 2 | **Open WebUI** | Largest user base, active community | ⭐⭐⭐ (Svelte) |
| 3 | **LobeChat** | Already has branching feature, natural extension to Drill-Chat | ⭐⭐ |
| 4 | **assistant-ui** | UI library → component contribution | ⭐ |

**PR Strategy**
1. First post a proposal with demo link in the project's issues/discussions
2. Check maintainer response, then write the PR
3. PR must include:
   - Live demo link
   - Demo GIF
   - Community responses (Reddit/HN links)
   - Implementation code (adjusted for the project's codebase)

### 3C. AI Coding Agent Expansion

| Project | How to Apply? |
|---------|--------------|
| **Roo Code** | UX extension of Boomerang Tasks — add drill-down UI within answers |
| **Cline** | Join issue #1498, propose sub-task UX using Drill-Chat pattern |
| **Continue.dev** | Propose Drill-Chat feature for the chat panel |

---

## Phase 4: Long-term Vision (3+ months)

> **Goal**: Make Drill-Chat the new standard pattern for AI conversations.

### 4-1. Feature Expansion

| Feature | Description |
|---------|-------------|
| **Multi-LLM Support** | Choose from OpenAI, Anthropic, Google, Ollama (local) |
| **Conversation Export** | Export Drill-Chat tree structure to Markdown/PDF |
| **Collaboration Mode** | Multiple users share/edit a single conversation tree |
| **Plugin System** | Custom Drill actions (translate, summarize, code execution, etc.) |
| **MCP Integration** | Call external tools (search, code execution, etc.) from sub-conversations |

### 4-2. Monetization (Optional)

| Model | Description |
|-------|-------------|
| **BYOK (Bring Your Own Key)** | Users enter their own API key → free service |
| **Hosted Version** | Use without API key → usage-based billing |
| **Enterprise** | Team features, SAML SSO, audit logs → enterprise license |

### 4-3. Ultimate Goal

```
Current AI conversation:  [Question] → [Answer] → [Question] → [Answer] → ...  (1D)

After Drill-Chat:         [Question] → [Answer Tree] → [Explore] → [Sync] → [Complete Knowledge]  (Multi-dimensional)
```

When Drill-Chat becomes widespread, AI conversations shift from **"question-answer streams"** to **"explorable knowledge structures"**.

---

## Risk Analysis & Mitigation

### Risk 1: "What if a big company implements it first?"

| Scenario | Response |
|----------|----------|
| ChatGPT releases a similar feature | Actually validates the market → "we built it first" + position as open-source alternative |
| Open-source project implements independently | Secure credit as PR contributor, library remains independent |

**Key**: Big companies copying is **proof the idea is good**. Implementation timing is recorded in Git.

### Risk 2: "What if nobody cares?"

| Scenario | Response |
|----------|----------|
| Minimal Reddit/HN response | Improve UX and repost, or change target communities |
| Prototype isn't convincing | User interviews to revalidate actual pain points |

### Risk 3: "What if Sync-back is technically difficult?"

| Scenario | Response |
|----------|----------|
| AI doesn't integrate original answer well | Iterate on prompt engineering, use structured JSON output |
| Answer formatting breaks | Preserve structure with markdown parser, diff-based partial updates |

---

## Timeline Summary

```
Week 0  ──── Phase 0: GitHub repo creation, concept/roadmap commit
              │
Week 1-2 ─── Phase 1: Prototype development (Chat UI + Drill-Chat + Sync-back)
              │
Week 3  ──── Phase 2: Vercel deployment, demo production, community posting
              │
              ├── Hot response → Phase 3A: Independent growth + npm library
              │
              └── Moderate response → Phase 3B: Focus on open-source PRs
              │
Week 5+  ──── Phase 3: Open-source expansion / library publication
              │
Month 3+ ──── Phase 4: Long-term vision (Multi-LLM, collaboration, monetization)
```

---

*Drill-Chat — Changing the depth of conversation.*

*Last updated: 2026-03-29*
