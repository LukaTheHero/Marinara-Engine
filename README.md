# 🍝 Marinara Engine

### Alpha Release 1.0.0

**An AI-powered chat & roleplay engine** — with conversation, roleplay, and visual novel modes, a full character & sprite system, 18 built-in AI agents, turn-based combat, lorebooks, and more.

Everything runs locally. No accounts, no cloud, no telemetry. Connect to any OpenAI-compatible API (OpenAI, Anthropic, Google, OpenRouter, Mistral, Cohere, or any custom endpoint).

> **⚠️ Alpha Software** — This is an early release. Expect rough edges, missing features, and breaking changes between versions. Bug reports and feedback are very welcome!

---

## Features

### Chat & Roleplay
- **Three Chat Modes** — Conversation (iMessage-style), Roleplay (immersive dark RPG), Visual Novel
- **Character Management** — Create or import characters with avatars, personalities, backstories, and system prompts
- **Persona System** — User personas with custom names, avatars, and descriptions
- **Group Chats** — Multiple characters in a single conversation
- **Chat Branching** — Branch conversations at any message and explore different paths
- **Message Swiping** — Generate alternate responses and swipe between them
- **SillyTavern Import** — Migrate characters, chats, presets, and settings from SillyTavern

### Visual & Immersive
- **Sprite System** — Character expression sprites with automatic emotion-based switching
- **Custom Backgrounds** — Upload backgrounds with per-scene switching
- **Weather Effects** — Dynamic weather overlays (rain, snow, fog, etc.)
- **Two Visual Themes** — Y2K Marinara theme and a faithful SillyTavern classic theme
- **Light & Dark Mode**

### AI Agent System (18 Built-In)
Agents are autonomous AI assistants that run alongside your chat, each handling a specific task:

| Agent | What It Does |
|-------|-------------|
| **World State** | Tracks date/time, weather, location, and present characters |
| **Quest Tracker** | Manages quest objectives, completion, and rewards |
| **Character Tracker** | Monitors character moods, relationships, and inventory |
| **Persona Stats** | Tracks your protagonist's HP, MP, XP, and custom stats |
| **Narrative Director** | Introduces events, NPCs, and plot beats to keep the story moving |
| **Prose Guardian** | Rewrites AI responses to improve prose quality |
| **Continuity Checker** | Detects contradictions with established lore and facts |
| **Combat** | Turn-based RPG combat with initiative, HP tracking, and actions |
| **Expression Engine** | Detects emotions and selects character sprites |
| **Background** | Picks the best background image for the current scene |
| **Echo Chamber** | Simulates a live-stream chat reacting to your roleplay |
| **Prompt Reviewer** | Reviews and scores the assembled prompt before generation |
| **Illustrator** | Generates image prompts for key scenes |
| **Lorebook Keeper** | Automatically creates and updates lorebook entries |
| **Immersive HTML** | Formats roleplay output with styled HTML |
| **Consistency Editor** | Edits responses for internal consistency |
| **Spotify DJ** | Controls Spotify playback to match the scene mood |
| **Chat Summarizer** | Generates condensed summaries of long conversations |

All agents are disabled by default — enable only the ones you want. You can also create **custom agents** with your own prompts and tool configurations.

### Prompt Engineering
- **Preset System** — Save and load full prompt configurations (system prompt sections, sampling parameters, etc.)
- **Prompt Sections** — Modular prompt builder with drag-and-drop ordering, depth injection, and per-section toggles
- **Lorebooks** — World-building entries with keyword triggers that inject context automatically
- **Regex Scripts** — Custom text processing with regex find/replace on inputs and outputs
- **Macro System** — Template variables like `{{char}}`, `{{user}}`, `{{time}}`, and agent markers

### Connections & Providers
- **Multi-Provider** — OpenAI, Anthropic, Google, OpenRouter, Mistral, Cohere, and any custom OpenAI-compatible endpoint
- **Encrypted API Keys** — API keys are encrypted at rest with AES-256
- **Per-Chat Overrides** — Different presets and connections per chat

### Export & Data
- **Export Chats** — Save as JSON or Markdown
- **Fully Local** — SQLite database, all data stays on your machine
- **No Account Required** — Just install and go

---

## Installation

### Option A: Desktop App (Recommended)

Download the latest installer from the [Releases](https://github.com/your-repo/rpg-engine/releases) page:

| Platform | File |
|----------|------|
| Windows | `RPG-Engine-Setup-1.0.0.exe` |
| macOS (Apple Silicon) | `RPG-Engine-1.0.0-arm64.dmg` |
| macOS (Intel) | `RPG-Engine-1.0.0-x64.dmg` |
| Linux | `RPG-Engine-1.0.0.AppImage` |

Just run the installer and launch — everything is bundled.

---

### Option B: Run from Source

If you'd rather not run an installer, you can run Marinara directly from source. Same app, just without the Electron desktop wrapper.

#### Prerequisites

- **[Node.js v20+](https://nodejs.org/)** — download from [nodejs.org](https://nodejs.org/en/download)
- **[pnpm](https://pnpm.io/)** — install via `corepack enable` (included with Node.js) or `npm install -g pnpm`
- **[Git](https://git-scm.com/)** — to clone the repo

#### Quick Start

**Windows:**
```
git clone https://github.com/your-repo/rpg-engine.git
cd rpg-engine
start.bat
```

**macOS / Linux:**
```bash
git clone https://github.com/your-repo/rpg-engine.git
cd rpg-engine
chmod +x start.sh
./start.sh
```

The start script will:
1. Check that Node.js and pnpm are installed
2. Install all dependencies (first run only)
3. Build the application
4. Initialize the database
5. Start the server and open `http://localhost:7860` in your browser

#### Manual Setup

```bash
git clone https://github.com/your-repo/rpg-engine.git
cd rpg-engine
pnpm install
pnpm build
pnpm db:push
pnpm start
```

Then open **http://localhost:7860**. That's it — no account, no cloud, everything runs locally.

#### Updating

```bash
git pull
pnpm install
pnpm build
pnpm db:push
```

Then restart the server.

---

## Development

```bash
# Start both server + client with hot reload
pnpm dev

# Server only (port 7860)
pnpm dev:server

# Client only (port 5173, proxies API to server)
pnpm dev:client
```

### Building Desktop Installers

```bash
pnpm package          # Build for current platform
pnpm package:win      # Windows .exe
pnpm package:mac      # macOS .dmg
pnpm package:linux    # Linux .AppImage
```

Output goes to `release/`.

---

## Configuration

Copy `.env.example` to `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7860` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_URL` | `file:./data/rpg-engine.db` | SQLite database path |
| `ENCRYPTION_KEY` | *(empty)* | AES key for API key encryption (generate with `openssl rand -hex 32`) |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |

---

## Project Structure

```
rpg-engine/
├── packages/
│   ├── shared/      # TypeScript types, schemas, constants
│   ├── server/      # Fastify API + SQLite database + AI agents
│   └── client/      # React frontend (Vite + Tailwind v4)
├── electron/        # Electron desktop wrapper
├── start.bat        # Windows launcher
├── start.sh         # macOS/Linux launcher
└── .env.example     # Environment template
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS v4, Framer Motion, Zustand, React Query |
| Backend | Fastify 5, Drizzle ORM, SQLite |
| Desktop | Electron 33, electron-builder |
| Shared | TypeScript 5, Zod |
| Build | Vite 6, pnpm workspaces |

---

## License

[AGPL-3.0](LICENSE)

## License

[AGPL-3.0](LICENSE)
