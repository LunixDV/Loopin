# Project Overview: Loopin

**Loopin** is an AI-powered event parsing and calendar synchronization utility. It accepts images (screenshots of events, flyers, email snapshots) or raw textual notes, extracts structured calendar event fields using LLM-based parsing, and synchronizes them directly into Google Calendar.

---

## 1. Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) utilizing React Server Actions.
- **Runtime & Test Runner**: [Bun](https://bun.sh/).
- **AI Integration**: [Groq SDK](https://github.com/groq/groq-typescript) powering Llama 3 models for high-performance schema extraction.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native CSS variable themes.
- **Validation**: [Zod](https://zod.dev/) Zod schema validations.
- **Code Quality**: Prettier formatter, ESLint, and Husky pre-commit hooks.

---

## 2. Directory Structure

```
├── app/                  # Next.js App Router (Layouts, Pages, Server Actions)
│   ├── components/       # UI Components (e.g. Constellation background canvas)
│   ├── actions.ts        # Server Actions (Ingests files/text, invokes parsing)
│   ├── globals.css       # Core styling & theme variables
│   └── manifest.ts       # PWA Manifest configuration
├── docs/                 # Documentation directory
│   ├── project_overview.md
│   └── contributors.md
├── lib/                  # Business logic & validations
│   ├── event-intake.ts   # Event processing helper utilities
│   └── event-types.ts    # Zod schemas & shared interface types
├── public/               # Static assets & PWA service workers (sw.js)
├── tests/                # Bun testing suites
└── package.json          # Project dependencies & automation scripts
```

---

## 3. Core Architecture & Workflow

### Phase A: Event Extraction

1. The user inputs text or drops images into the centered landing page input bar.
2. The client triggers the `ingestEvents` Server Action in [actions.ts](file:///home/zenmi/Projects/Loopin/app/actions.ts).
3. The Server Action uses the Groq SDK to call Llama 3. Llama extracts structured event payloads (summary, start date, end date, location, description).
4. The response is validated against the Zod `extractionResultSchema` defined in [event-types.ts](file:///home/zenmi/Projects/Loopin/lib/event-types.ts).

### Phase B: Calendar Synchronization

1. If the user provided a Google Calendar ID and OAuth Access Token in the settings drawer, the Server Action posts the extracted events directly to the Google Calendar API.
2. The UI renders the parsed events in interactive cards.
