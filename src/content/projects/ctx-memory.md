---
title: ctx-memory, a memory for coding agents
description: Every new AI coding session starts from zero. This keeps what the last one learned, locally, across Claude Code, Codex, Gemini CLI and OpenCode.
technologies: [TypeScript, SQLite, MCP]
featured: false
source: https://github.com/GhadiSaab/ctx-memory
live: https://www.npmjs.com/package/ctx-memory
---

AI coding agents forget everything when a session ends. The next one re-reads the
same files, re-discovers the same conventions, and sometimes re-makes a decision
you already rejected. Switching between tools is worse: Claude Code doesn't know
what you did in Codex an hour ago.

ctx-memory is a small layer that sits next to all of them and remembers. It's on
npm, and nothing leaves your machine: everything lives in one SQLite file in your
home directory.

## How a session gets remembered

A shell wrapper intercepts `claude`, `codex`, `gemini` or `opencode`, and starts
an MCP server alongside the session. Hooks record what happens as it happens:
messages, tool calls, files edited, commands run. When the session ends, cleanly
or not, three passes turn that into something the next session can use:

1. **Extract** the parts that carry weight: decisions, errors, files touched,
   keywords.
2. **Compress** them into a digest of at most 500 tokens.
3. **Merge** the digest into a running memory document for the project.

The next session starts with that document already in context, and can search
older sessions through the MCP server, by keyword or by meaning using local
embeddings.

## Two rules that kept it sane

The three processing passes are pure functions: no I/O and they never throw. All
the messy parts (databases, files, shell hooks) stay at the edges. That's what
made the core easy to test, and the suite is now past 470 tests.

The other rule is the 500-token cap. Memory that grows without bound eventually
costs more context than it saves, so the digest has to earn its space.
