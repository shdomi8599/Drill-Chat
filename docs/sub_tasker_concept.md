# Sub-Tasker: A New UX Pattern That Changes the Depth of AI Conversations

> **One-line summary**: A tree-structured conversation UX that lets you select specific parts of an AI answer to open inline sub-conversations and sync the results back into the original response.

---

## 1. Problem Definition

### Structural Limitations of Current AI Conversations

Every AI conversation interface operates as a **linear, one-dimensional stream**:

```
[Question] → [Answer] → [Question] → [Answer] → ...
```

When a user receives an answer with multiple items from an AI, the following problems arise:

#### ① Inability to Explore Parts Independently
When users want to learn more about a specific item, follow-up questions steer the conversation in that direction, causing context about other items to fade.

#### ② Loss of Context
After exchanging multiple follow-up questions and answers, the overall structure of the original answer is pushed up in the chat and effectively disappears.

#### ③ Fragmentation of Results
Deep exploration of a sub-topic produces results that are disconnected from the original answer, forcing users to mentally integrate them.

### Concrete Scenario

```
User: "How do I start a franchise business?"

AI Answer:
  1. Business registration
  2. Franchise application process
  3. Finding and setting up a location
  4. Preparing initial capital
  5. Marketing strategy
```

In this situation, the user only wants more details about **#2 (Franchise application process)**. However:

- Asking a follow-up → the entire conversation shifts toward "franchise application"
- Items 1, 3, 4, 5 → must be asked about again later
- Detailed information gained about #2 → exists separately from the original 5-step answer

---

## 2. Solution: Sub-Tasker

### Core Concept

A UX pattern that opens **inline sub-conversations** about specific parts of an AI answer, allows free-form follow-up Q&A within them, and then **syncs the results back (Sync-back)** into the original answer.

This transforms the conversation structure from a **1D stream** into an **explorable tree**.

### Workflow

```
[Main Question] → [AI Answer: 1. ... 2. ... 3. ... 4. ... 5. ...]
                                │
                           [Select #2]
                                │
                      ┌─────────▼──────────┐
                      │  Sub-conversation   │
                      │                     │
                      │  Q: How much does   │
                      │     the franchise   │
                      │     application     │
                      │     cost?           │
                      │  A: About $30K...   │
                      │                     │
                      │  Q: Training period?│
                      │  A: 2-week course...│
                      │                     │
                      │  [✅ Sync to answer]│
                      └─────────┬──────────┘
                                │
                                ▼
                [AI Answer: 1. ... 2. ★Enhanced★ 3. ... 4. ... 5. ...]
```

### 3-Step Process

#### Step 1. Select
The user selects a specific part of the AI answer.

- **Method A**: Click the "🔍 Learn more" button provided on each item
- **Method B**: Drag-select answer text, then choose "Open sub-question" from the popup
- **Method C**: Click specific text to have AI auto-expand the related phrase

#### Step 2. Explore
A sub-conversation panel opens, allowing free-form follow-up Q&A about the selected topic.

- The sub-conversation context includes the full root answer
- Multiple ping-pong exchanges (multi-turn) within the sub-conversation
- Optionally open another sub-conversation within (nested, optional)

#### Step 3. Sync-back
When the sub-conversation is complete, integrate the results into the root answer.

- User clicks "Sync to full answer" button
- AI organizes and updates the relevant item in the root answer with information from the sub-conversation
- Root answer is replaced with an **enhanced version** containing the sub-conversation insights

---

## 3. UI/UX Design

### Sub-conversation Panel Options

#### Option A: Bottom Modal Panel
```
┌──────────────────────────────────┐
│  [Main Chat]                     │
│                                   │
│  AI: 1. Business registration     │
│      2. Franchise application ← selected
│      3. Finding a location        │
│                                   │
├──────────────────────────────────┤
│  [Sub-conversation Panel]         │
│  Ask about "Franchise application"│
│  ┌─────────────────────────────┐ │
│  │ Type here...                │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

- Pros: Can see main conversation while asking sub-questions
- Cons: Screen space is divided

#### Option B: Inline Expansion (Accordion)
```
AI: 1. Business registration
    2. Franchise application
       ┌─────────────────────────┐
       │ Q: How much does it cost?│
       │ A: About $30K...        │
       │ Q: Training period?     │
       │ A: 2-week course...     │
       │ [Type...]  [✅ Sync]    │
       └─────────────────────────┘
    3. Finding a location
```

- Pros: Most natural context preservation
- Cons: Answer can become very long

#### Option C: Side Panel
```
┌─────────────────────┬──────────────────┐
│  [Main Chat]         │  [Sub-chat]       │
│                      │                   │
│  AI:                 │  "Franchise app"  │
│  1. Business reg.    │                   │
│  2. Franchise ←───── │  Q: Cost?         │
│  3. Location         │  A: $30K...       │
│                      │                   │
│                      │  [✅ Sync]        │
└─────────────────────┴──────────────────┘
```

- Pros: Wide workspace, view main/sub simultaneously
- Cons: Difficult for mobile

#### Option D: Drag-based Popover
```
AI: 1. Business registration
    2. [Franchise application] ← drag-selected
                    ┌────────────────────┐
                    │ 💬 Open sub-question│
                    │ 📋 Copy            │
                    │ 🔖 Bookmark        │
                    └────────────────────┘
```

- Pros: Naturally connects with existing text selection patterns
- Cons: Drag interaction can be awkward on mobile

---

## 4. Application Areas

### AI Chatbots (Most Intuitive Application)
- General-purpose AI chatbots like ChatGPT, Claude, Gemini
- Open-source AI frontends like Open WebUI, LibreChat, LobeChat
- When users need to dig deeper into specific items during information exploration

### AI Coding Agents
- Coding assistants like **Cursor, Roo Code, Cline, Antigravity**
- Example: "Explain this project's architecture" → sub-question only about "database layer"
- Discuss a specific step in an implementation plan, then sync back to the full plan

### AI Agents (GUI / Autonomous)
- Reports/deliverables generated by agents like **Codex, Devin**
- Drill down into specific parts of an agent's final output for additional exploration
- Automatically sync exploration results into the final report

### Education / Research Tools
- "Explain the key concepts of quantum mechanics" → drill down only into "wave-particle duality"
- Drill down into specific parts of literature summaries in a research assistant AI

---

## 5. Technical Considerations

### Data Structure

Conversations must be modeled as a tree structure:

```
RootMessage {
  id: string
  content: string
  subConversations: SubConversation[]
}

SubConversation {
  id: string
  anchorText: string          // Selected text (e.g., "Franchise application")
  anchorRange: [start, end]   // Position within original text
  messages: Message[]         // Sub-conversation messages
  syncedBack: boolean         // Whether it has been synced
  syncedContent?: string      // Synced content
}
```

### Sync-back Strategies

| Strategy | Description | Pros/Cons |
|----------|-------------|-----------|
| **AI Auto-integration** | Upon sub-conv completion, AI auto-rewrites root answer | Smooth but may cause unwanted changes |
| **User Approval** | "Sync" button → AI proposes integration → user reviews/edits → confirmed | Safe but requires extra step |
| **Inline Insertion** | Sub-conv summary added as collapsible block under the item | Preserves original, non-destructive |
| **Hybrid** | Default is inline insertion, full rewrite on user request | Flexible but complex to implement |

### Nesting Depth

Can sub-conversations be opened within sub-conversations?

- **Recommended**: Allow up to 2 levels deep
- **Reason**: 3+ levels creates UX complexity and context window burden
- **Alternative**: Design breadcrumb navigation to manage deep exploration

### Context Management

Context to pass to sub-conversations:

```
Sub-conversation context = {
  Full root answer (summary or full text),
  Selected anchor text,
  Previous sub-conversation history (if any),
  User's sub-question
}
```

---

## 6. Differentiation from Existing Solutions

### Existing "Branching" vs Sub-Tasker

```
[Existing Branching = Fork]

  Message A ──→ Message B ──→ Message C
                    │
                    └──→ Message B' ──→ Message C'  (independent new conversation)

  • No connection to original conversation after fork
  • Exploration results exist only in the new conversation
  • Original answer remains unchanged
```

```
[Sub-Tasker = Drill-down + Merge]

  Answer [Item 1, Item 2, Item 3]
                │
          [Select Item 2]
                │
        ┌───────▼────────┐
        │ Sub-conversation│
        │ Q → A → Q → A  │
        └───────┬────────┘
                │ (Sync-back)
                ▼
  Answer [Item 1, Item 2 ★Enhanced★, Item 3]

  • Sub-conversation is linked to the original answer
  • Exploration results enhance the original answer
  • End result is a single, complete answer
```

### Key Differences Summary

| Comparison | Existing Branching (Fork) | Sub-Tasker (Drill-down + Merge) |
|------------|--------------------------|--------------------------------|
| Sub-conv & original relationship | Independent (no link) | Connected (anchor-based) |
| Original answer changes | ❌ No change | ✅ Enhanced with sub-results |
| User intent | "Explore a different direction" | "Deep-dive into a specific part" |
| Final output | Two separate conversations | One enhanced answer |
| Metaphor | Git branch | Wikipedia hyperlink + edit |

---

## 7. Naming Candidates

| Name | Feel |
|------|------|
| **Sub-Tasker** | A tool that performs sub-tasks |
| **Drill-Chat** | Drill-down based conversation |
| **DeepThread** | Deep thread exploration |
| **InlineExplorer** | Inline explorer |
| **ContextDive** | Diving within context |
| **ThreadWeave** | A tool that weaves threads |
| **AnchorChat** | Anchor-based conversation branching |

---

## 8. Goals and Vision

### Short-term Goals
- Develop an independent prototype (web demo)
- Validate the core UX pattern (inline drill-down + sync-back)
- Collect open-source community feedback

### Mid-term Goals
- Submit PRs to major open-source AI frontends (LibreChat, Open WebUI, LobeChat)
- Or publish as an independent UI library (React components)
- Discuss integration with AI coding agent ecosystem (Roo Code, Cline, etc.)

### Long-term Vision
- Establish as a new standard UX pattern for AI conversation interfaces
- Lead the paradigm shift from "linear conversations" to "explorable knowledge trees"
- Adopted as a next-generation feature by major AI services (ChatGPT, Claude, Gemini)

---

*Last updated: 2026-03-29*
