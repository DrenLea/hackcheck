# Claude Code Installation Guide

## Project-Level Installation

1. Copy the `hackathon-topic-advisor/` directory to your project:
   ```
   .claude/skills/hackathon-topic-advisor/
   ├── SKILL.md
   ├── references/
   ├── scripts/
   └── ...
   ```

2. Claude Code auto-detects skills in `.claude/skills/`. No restart needed (hot reload).

3. Trigger by typing: `/hackathon-topic-advisor` or by mentioning hackathon topics naturally.

## Global Installation

1. Copy to the user-level skills directory:
   ```
   ~/.claude/skills/hackathon-topic-advisor/
   ```

2. Available across all projects and sessions.

## Frontmatter Fields

Claude Code uses these fields from the YAML frontmatter:

| Field | Purpose |
|-------|---------|
| `name` | Skill identifier (kebab-case) |
| `description` | Always loaded — Claude uses this to decide when to activate |
| `triggers` | Keywords that auto-activate the skill |
| `tags` | Categorization for skill management |
| `allowed-tools` | Restricts which tools the skill can use |
| `version` | Skill version for compatibility |

## Progressive Disclosure

Claude Code follows the three-level loading:
1. `description` is always in context (Level 1)
2. `SKILL.md` body loads when skill is activated (Level 2)
3. `references/` files load on demand when referenced (Level 3)

This minimizes token usage — the 100+ concept map only loads when actually needed.

## Verification

In Claude Code, type: "I'm doing a hackathon, can you validate my project idea?"
The skill should activate and start asking clarifying questions.

## Notes

- Claude Code Skills follow the agentskills.io open standard
- The `allowed-tools` field ensures the skill can use WebSearch, WebFetch, Read, and Bash
- The scoring script is executed via the Bash tool
