# Codex Fresh Start Pack

This pack is for starting the compliance card game MVP from a new empty project folder.

Use it in this order:

1. Copy `AGENTS.md` and the `docs/` folder into the project root.
2. Commit those documents.
3. Open Codex in the project root.
4. Run `prompts/00_PLAN_FIRST_NO_CODE.txt`.
5. After reviewing the plan, run `prompts/01_INITIALIZE_PROJECT.txt`.
6. Continue with one ticket at a time from `docs/TICKETS_01_TO_12.md`.

Important:
- Do not ask Codex to build the full game at once.
- Do not run multiple implementation tickets in one prompt.
- Keep `docs/PROJECT_BRIEF.md` as a product guardrail, not a command to implement everything.
- After the technical stack is chosen and project initialized, ask Codex to update `AGENTS.md` with the actual build/test/dev commands.
