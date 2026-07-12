# Hackathon Topic Advisor

A cross-platform AI skill that validates hackathon project ideas through multi-round dialogue, multi-channel search, social demand discovery, and three-dimensional scoring.

## What It Does

Helps hackathon participants answer: **"Is my project idea worth building?"**

The skill:
1. **Asks clarifying questions** — AI helps you articulate your target user, core scenario, and differentiation
2. **Searches for similar projects** — GitHub, Devpost, Product Hunt, and general web
3. **Discovers social demand** — Finds real user quotes on Reddit, Twitter, V2EX, Zhihu expressing need for this type of product
4. **Scores your idea** — Three-dimensional scoring: Originality + Scarcity + Social Impact
5. **Recommends blue ocean directions** — If your idea is in a red ocean, suggests how to pivot
6. **Iterates** — Adjust your idea and re-analyze until you find a winning direction

## Cross-Platform Compatibility

| Platform | Status | Install Guide |
|----------|--------|---------------|
| TRAE | ✅ Supported | [install/trae.md](install/trae.md) |
| Claude Code | ✅ Supported | [install/claude-code.md](install/claude-code.md) |
| Cursor | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |
| Windsurf | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |
| AGENTS.md tools | ✅ Adapted | [install/other-tools.md](install/other-tools.md) |

## Quick Start

1. Install the skill to your preferred platform (see links above)
2. Start a conversation: "I'm participating in a hackathon and want to validate my project idea"
3. The AI will guide you through the workflow

## Scoring System

| Score | Ocean Type | Meaning |
|-------|-----------|---------|
| ≥ 70 | 🌊 Blue | Scarce, original, high social value |
| 45-69 | ⚡ Yellow | Some competition, needs differentiation |
| < 45 | 🔥 Red | Saturated, needs unique angle |

Score = Scarcity (40%) + Originality (35%) + Meaning (25%)

See [references/scoring-rules.md](references/scoring-rules.md) for full scoring algorithm.

## Source

This skill is derived from HackCheck, a hackathon full-process assistant web app. The topic validation module's logic has been extracted and enhanced with:
- Multi-round dialogue (AI asks clarifying questions)
- Social demand discovery (searching for real user needs)
- Cross-platform compatibility (works in any vibe-coding tool)
- Lightweight Python scoring script

## Requirements

- Python 3.6+ (for the scoring script; AI can fall back to manual scoring if unavailable)
- A vibe-coding tool that supports custom skills/rules (TRAE, Claude Code, Cursor, etc.)

## License

MIT
