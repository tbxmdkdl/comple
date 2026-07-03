# Codex Workflow Guide

## Your Operating Loop

Use this loop for every ticket.

1. Save current state with Git.
2. Paste the universal prefix and one ticket prompt into Codex.
3. Require Codex to inspect files and propose a short plan first.
4. Let Codex implement only that ticket.
5. Run the build/test commands Codex reports.
6. Manually test the feature.
7. Review the diff.
8. Commit only if acceptable.

## Recommended Git Checkpoint Commands

After adding this pack:

```bash
git init
git add AGENTS.md docs
git commit -m "add project brief and Codex instructions"
```

After each ticket:

```bash
git status
git diff
git add .
git commit -m "ticket XX: short description"
```

## Universal Prefix for Every Ticket

Paste this before each implementation ticket:

```text
Language rule: Respond to the user in Korean. Keep code identifiers, filenames, commands, package names, and APIs in English. Create user-facing game text in Korean unless this ticket explicitly says otherwise.

Before implementing, read AGENTS.md, docs/PROJECT_BRIEF.md, docs/DESIGN_DIRECTION.md, and docs/KOREAN_CONTENT_STYLE.md.
Use them as guardrails only.
Implement only the requested ticket below.
Do not expand scope based on the full project brief or guardrail documents.
Preserve the current architecture and naming conventions unless this ticket explicitly asks for a change.
If the brief or guardrail documents conflict with the existing implementation, complete the ticket using the existing implementation as the technical source of truth and mention the conflict in your Korean summary.

Before coding:
- inspect the relevant files
- propose a short implementation plan in Korean
- wait for confirmation if the plan changes the requested scope

After coding:
- summarize changed files in Korean
- list commands/tests run
- list remaining risks in Korean
```

## Do Not Do This

Do not ask Codex:

```text
Build the whole game from the project brief.
```

Do not ask Codex:

```text
Implement tickets 1 through 5 at once.
```

Do not ask Codex:

```text
Refactor the whole architecture to match the brief.
```

## Good Ticket Shape

```text
Goal:
[One clear goal]

Context:
[Why this matters and which docs/files are relevant]

Files to inspect:
[...]

Files to modify:
[...]

Constraints:
- Keep changes small.
- Do not implement unrelated systems.
- Keep logic and UI separated.
- Keep content data-driven.
- Add tests for pure logic when applicable.

Implementation details:
[Specific requirements]

Done when:
[Measurable completion criteria]

Manual test steps:
[How to verify in app]
```

## Stop Conditions

Pause and review manually if Codex:
- changes more files than expected
- adds unapproved dependencies
- implements future features not requested
- deletes working code
- changes the chosen stack without permission
- turns content into long quiz text
- hardcodes cards or scenarios inside UI
