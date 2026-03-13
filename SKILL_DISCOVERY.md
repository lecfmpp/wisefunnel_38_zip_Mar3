# Skill Discovery & Acquisition Guide

## Purpose

This guide standardizes how I (and other agents) expand capabilities when faced with new tasks. It ensures I always check for existing skills before claiming inability, and safely acquire new ones when appropriate.

## Workflow Summary

1. **Check available skills** (from system prompt) → Use if applicable
2. **Search OpenClaw docs** → Find native capabilities
3. **Search Clawhub** → Find community skills
4. **Install & integrate** → Add to workspace
5. **Document & share** → Update memory, inform team

## Step-by-Step

### 1. Scan Available Skills

On session start, the system prompt includes an `available_skills` list. Review it for any skill matching the task. Common categories:

- `gog` — Google Workspace (Gmail, Calendar, Drive, Sheets, Docs)
- `slack` — Slack messaging and reactions
- `himalaya` — Email via IMAP
- `web_search`, `web_fetch` — Web access
- `github` — GitHub operations
- `summarize` — Transcribe and summarize media
- And many more...

If you find a match, read its `SKILL.md` immediately and use it.

### 2. Search OpenClaw Documentation

If no skill from the list fits, search the official docs:

```
web_search(query="OpenClaw <task> skill", count=5)
```

or

```
web_search(query="how to <task> with OpenClaw", count=5)
```

Check results for:

- References to existing skills you might have missed
- CLI commands or APIs you can call directly (`openclaw <command>`)
- Configuration options that enable the capability
- Scripts in the OpenClaw repo (https://github.com/openclaw/openclaw)

If you discover a native way to do the task, document it in `TOOLS.md` for future reference.

### 3. Search Clawhub

If the docs don't help, search Clawhub (the skill marketplace):

```
web_search(query="clawhub <task> skill", count=5)
```

Visit https://clawhub.com and search directly if needed.

**Safety check:** Before installing any skill:
- Verify it's from a reputable author or official OpenClaw organization
- Read its `SKILL.md` to understand what it does
- Ensure it doesn't request dangerous permissions (e.g., destructive commands, external network access beyond its purpose)
- Prefer skills with recent updates and good community feedback

### 4. Installation

#### Using `clawhub` CLI

If you have `clawhub` installed:

```bash
clawhub install <skill-name>
```

It will place the skill in `~/.openclaw/workspace/skills/` or the global skills directory.

#### Building a Custom Skill

If you need to create a skill from scratch or modify one, use the `skill-creator` skill (if available):

```bash
# Invoke skill-creator to scaffold a new skill
openclaw skill create <skill-name> --description "..."
```

See `/opt/homebrew/lib/node_modules/openclaw/skills/skill-creator/SKILL.md` for details.

After installing or updating a skill, you may need to:
- Restart your OpenClaw session
- Or run `openclaw skills reload` (if available)
- Verify it appears in `available_skills` on the next system prompt

### 5. Documentation

Record new skills and their usage in:

- `TOOLS.md` — Local notes: camera names, SSH hosts, voice preferences, plus any newly installed skill details and configuration
- `SKILLS.md` (optional) — Dedicated catalog of all skills you use, with examples and caveats
- `memory/YYYY-MM-DD.md` — Log the acquisition for future reference

Also update any project-specific context files if the skill is relevant to ongoing work.

### 6. Sharing with the Team

If the skill could benefit other agents (e.g., `wblog`, `wcoder`, `wsocial`), inform them:

- Send a message to their sessions: `sessions_send(sessionKey, "New skill available: <name> — <use case>. Docs at <path>")`
- Or commit a shared note in the workspace: `AGENTS.md` or `SKILLS.md`

## Examples

### Example 1: Transcribing Audio

Task: "Transcribe this voice note."

1. Check skills → `summarize` skill exists (for transcribing audio).
2. Read `SKILL.md` for `summarize`.
3. Use: `summarize /path/to/audio.m4a`
4. Done.

### Example 2: Managing a Telegram Group

Task: "Post an update to our Telegram channel."

1. No `telegram` skill in `available_skills`.
2. Search docs: `web_search("OpenClaw telegram skill")` → No native support.
3. Search Clawhub: `web_search("clawhub telegram")` → Find `openclaw-telegram` skill.
4. Verify: Author "openclaw", recent updates, simple permission set.
5. Install: `clawhub install openclaw-telegram`
6. Restart session; confirm skill in `available_skills`.
7. Use per its `SKILL.md`.
8. Document in `TOOLS.md`: "Telegram channel ID: @mychannel, using openclaw-telegram skill."
9. Notify `wsocial` agent via `sessions_send`.

### Example 3: Sending an Email via Gmail

Task: "Send an email to the team."

1. `gog` skill exists with Gmail support.
2. Read `SKILL.md` → use `gog gmail send --to ... --subject ... --body ...`
3. Done.

### Example 4: Checking UI / Browser / Mission Control

Task: "Check what's on screen" or "Verify the UI state" or "Look at Mission Control"

1. **Always use `peekaboo` skill** (screenshot/UI automation) to capture visual evidence.
2. Read `SKILL.md` for `peekaboo` to understand capture modes (full screen, region, window).
3. For quick screenshots: `peekaboo screenshot` (or `peekaboo capture`).
4. Send the screenshot to Leandro via Slack or save for review.
5. If the task involves repeated checks or UI interaction, consider using `peekaboo` automation features.
6. Document in `TOOLS.md` any specific display/window names or regions of interest.

## Protocol Summary (TL;DR)

**For every new task:**

1. **Check available skills** → Use if suitable
2. **Search docs.openclaw.ai** → Find native ways
3. **Search Clawhub** → Install safe skills
4. **For any visual check (browser, UI, Mission Control) → ALWAYS use `peekaboo` to screenshot.**
5. **Document** in `TOOLS.md`
6. **Share** with team

**Safety first:** Never install suspicious skills. When in doubt, ask.

## Notes

- If a task is **complex or multi-step**, consider spawning a sub-agent (`sessions_spawn`) with the appropriate skill set rather than doing everything yourself.
- If you're unsure whether a skill is "suspicious," err on the side of caution and ask the user for approval before installing.
- Keep `TOOLS.md` up-to-date; it's your cheat sheet for environment-specific details.
- This protocol is dynamic — update this file as better discovery methods emerge.
