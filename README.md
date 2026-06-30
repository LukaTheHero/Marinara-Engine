# 🍝 Marinara Engine — LukaTheHero's Personal Edition

This is a personal, edited version of **[Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine)**, maintained by **LukaTheHero** — a former Marinara Engine developer.

I run my own branch of Marinara Engine for **personal use**: I keep it in sync with the upstream project and layer my own preferences and changes on top. **Anyone is free to use it if they wish** — just know it's tailored to how *I* like to use it, not an official release.

For the full project — its complete feature set, installation guides, screenshots, and documentation — see the upstream repository: **[Pasta-Devs/Marinara-Engine](https://github.com/Pasta-Devs/Marinara-Engine)**.

---

## What's different in this edition

Everything below is layered on top of upstream Marinara Engine. I update this branch with my own preferences, and these are the changes specific to my version:

### 🧠 Claude (Subscription) model list + Fable 5

The Claude (Subscription) model picker mirrors the Claude Code model menu — current models first, then `(Legacy)` — and includes **Fable 5**, Opus 4.8, Sonnet 4.6, Haiku 4.5, and legacy Opus 4.7 / 4.6. Each 1M-capable model also gets its own **(1M context)** entry.

### 📏 1M-context support for Claude (Subscription)

Picking a **(1M context)** model turns on Anthropic's 1M-token context beta under the hood, so the full million-token window is actually used — and the app won't misread that choice as a silent model downgrade.

### 📂 Multi-open, persistent group folders (Characters & Personas)

Group folders in the Characters and Personas panels can be **open several at a time** instead of one-at-a-time, and which folders are open is **remembered** — it survives reloads, storage clears, and syncs across your devices.

### 🖱️ Right-click "Quick Start" on library characters

Right-click any character in the Characters panel — in the main list or inside a folder — to instantly **Quick Start Roleplay** or **Quick Start Conversation**. It's the same shortcut the Bot Browser already had, now available for every character in your library.

---

## License

[AGPL-3.0](LICENSE)
