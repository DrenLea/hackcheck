# Other Tools Installation Guide (Cursor, Windsurf, etc.)

## General Approach

Most vibe-coding tools support custom instructions or rules. The `SKILL.md` file is standard Markdown with YAML frontmatter — it can be adapted to any tool that reads project-level instruction files.

## Cursor

Cursor uses `.cursorrules` or `.cursor/rules/` for project instructions:

1. Create `.cursor/rules/hackathon-topic-advisor.md` in your project
2. Copy the content of `SKILL.md` (excluding the YAML frontmatter) into this file
3. Cursor will load these rules when working in the project

Alternatively, use Cursor's custom commands:
1. Create `.cursor/commands/hackathon-topic-advisor.md`
2. Copy the SKILL.md body content
3. Invoke with `/hackathon-topic-advisor` in Cursor chat

## Windsurf

Windsurf uses `.windsurfrules` for project instructions:

1. Create `.windsurfrules` in your project root (or append to existing)
2. Add the SKILL.md body content
3. Windsurf reads this file as project context

## Generic AGENTS.md

If your tool supports the AGENTS.md standard (30+ tools compatible):

1. Create or open `AGENTS.md` in your project root
2. Add a section pointing to the skill:
   ```markdown
   ## Hackathon Topic Advisor
   When the user asks about hackathon topics, project ideas, or topic validation,
   follow the instructions in `hackathon-topic-advisor/SKILL.md`.
   ```
3. The AI will read the SKILL.md when the topic comes up

## Manual Usage

If your tool doesn't support any of the above:

1. Copy the content of `SKILL.md` into your AI chat
2. Provide the reference files when needed
3. Run the scoring script manually:
   ```bash
   echo '{"description":"your project","search_total_count":100,"search_hit_ratio":0.3,"matched_patterns":[],"matched_boosters":[],"social_demand_level":"medium"}' | python hackathon-topic-advisor/scripts/topic_scorer.py
   ```

## Scoring Script

The scoring script (`scripts/topic_scorer.py`) works on any platform with Python 3.6+:
- No pip install required (stdlib only)
- No internet access needed
- No external file dependencies
