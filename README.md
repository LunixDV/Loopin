# loopin

**loopin** is a modern, high-performance web application built with Next.js 16 and React 19 designed to instantly extract structured calendar events from raw text notes or flyer screenshots using multimodal AI (Groq API) and sync them directly to Google Calendar.

---

## Key Features

- **Multimodal AI Event Extraction**: Drop image files (up to 3 event flyers, schedules, invite screenshots, or messaging threads) or paste raw, messy notes to extract structured events.
- **Google Calendar Synchronization**: Synchronizes parsed events directly into Google Calendar via native REST API calls.
- **Premium User Experience**: Visually rich interface utilizing glassmorphic panels, fluid layouts, modern transitions, and high-quality typography.
- **Absolute Responsive Layout**: Leverages CSS container queries and dynamic viewport height (`100dvh`) to prevent vertical layout shifts or horizontal overflows on mobile screens.
- **Production-Grade QA Pipeline**: Strict code format checks, linter validations, git pre-commit hooks, and unit tests.

---

## Technology Stack

- **Core Framework**: Next.js 16.2.10 (with Server Actions)
- **UI & View Engine**: React 19.2.4
- **Aesthetic Styling**: Tailwind CSS v4.3.2 (with custom theme variables)
- **Input Validation**: Zod v4.4.3
- **AI Integration**: OpenAI SDK v6.47.0 (configured with Groq endpoints)
- **Tooling**: Bun (runtime and test-runner), Prettier, ESLint, Husky

---

## Project Structure

```text
├── .agents/                    # Ralph's Method specs, plans, and tracking registries
├── .husky/                     # Git pre-commit hook files
├── app/                        # Next.js App Router codebase
│   ├── actions.ts              # Server Actions coordinating event ingestion and synchronization
│   ├── globals.css             # Tailwind v4 theme variables, utility mappings, and global styles
│   ├── layout.tsx              # Root HTML document structure and Google Font loading
│   └── page.tsx                # Client-side interactive dashboard and settings panel
├── lib/                        # Shared utility layers
│   ├── event-intake.ts         # Groq AI prompt engine and Google Calendar REST sync helpers
│   └── event-types.ts          # Zod schema definitions and shared TypeScript interface types
├── tests/                      # Core test suites (run via Bun Test)
│   ├── event-intake.test.ts    # Date normalizer and string manipulation unit tests
│   └── event-schema.test.ts    # Zod payload parser schema validation unit tests
└── package.json                # Project dependencies, devTools, and script triggers
```

---

## Getting Started

### Prerequisites

- **Bun Runtime**: Make sure you have [Bun](https://bun.sh) installed.
- **Groq API Key**: Get a key from the [Groq Console](https://console.groq.com).
- **Google Calendar ID & OAuth Access Token**: Refer to the setup guides in the application modal to authorize syncing.

### Installation

Clone this repository and install package dependencies:

```bash
bun install
```

### Environment Variables

Create a `.env.local` file in the root of the project to set up local fallback variables:

```env
# API Key for Groq AI extraction
GROQ_API_KEY="your_groq_api_key"

# Target Google Calendar (e.g. 'primary' or your email address)
GOOGLE_CALENDAR_ID="primary"

# Google OAuth Access Token (can be generated using Google OAuth Playground)
GOOGLE_CALENDAR_ACCESS_TOKEN="ya29.a0..."
```

### Running Locally

Start the local development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Verification & Commands

### Code Quality

Run Prettier check and ESLint:

```bash
# Check formatting
bun run format:check

# Format files
bun run format

# Run linter
bun run lint
```

### Running Tests

Run the test suite powered by Bun's native test-runner:

```bash
bun run test
```

### Building for Production

Compile Next.js production builds:

```bash
bun run build
```
