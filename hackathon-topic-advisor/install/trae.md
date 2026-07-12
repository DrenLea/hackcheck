# TRAE Installation Guide

## Project-Level Installation

1. Copy the `hackathon-topic-advisor/` directory to your project:
   ```
   .trae/skills/hackathon-topic-advisor/
   ├── SKILL.md
   ├── references/
   ├── scripts/
   └── ...
   ```

2. Restart TRAE or reload the workspace.

3. The skill activates when you mention hackathon topics in conversation.

## Global Installation

1. Copy to the global skills directory:
   ```
   ~/.trae-cn/skills/hackathon-topic-advisor/
   ```

2. Available across all projects.

## Verification

Ask TRAE: "我想参加黑客松，帮我分析一下选题" — the skill should activate and start the clarify phase.

## Notes

- TRAE reads the `name` and `description` fields from the YAML frontmatter
- The `triggers`, `tags`, `allowed-tools`, and `version` fields are ignored by TRAE but used by Claude Code
- The scoring script requires Python 3.6+ to be installed
