# AGENTS.md

## Project Identity

This repository is a fresh 2-week MVP for a compliance training card game.

The game should help players practice workplace compliance judgment through meaningful card-based decisions. It should feel like a real game, not a quiz, not a static training slide, and not a legal advice tool.

## Product Direction

Build a short, replayable, card-based decision game about realistic workplace dilemmas.

The player manages risk, evidence, trust, pressure, and limited attention while deciding how to respond to compliance-sensitive situations.

The project may use broad genre patterns such as cards, resources, choices, rewards, and repeatable runs. It must not copy any specific commercial game's names, UI, card names, map visuals, character concepts, wording, icons, or signature mechanics.

## MVP Target

- Development target: 2-week MVP
- Play session target: 10–15 minutes
- Goal: one complete playable loop
- Priority: complete, coherent, testable MVP over many partial features
- Audience: employees or corporate learners practicing compliance judgment

## Tooling Assumption

Codex is the main development tool for this project.

When implementing, Codex should:
- inspect relevant files first
- propose a short plan before coding
- implement only the requested ticket
- keep changes small
- summarize changed files and tests run
- mention remaining risks or conflicts

## Technology Direction

The exact stack should be chosen deliberately based on `docs/PROJECT_BRIEF.md`.

Do not choose a technology stack just because it was mentioned as an example.

Before implementation begins, evaluate options against:
- 2-week MVP feasibility
- card UI implementation ease
- state management simplicity
- Codex readability and maintainability
- testability
- static deployment ease
- content-data separation
- future expansion potential

After the stack is chosen and project setup is complete, update this file with exact commands for:
- install
- development server
- build
- test
- lint or typecheck, if available

## Design Pillars

Every major feature should support at least one of:

1. Meaningful choice
2. Risk-reward tension
3. Short-term vs long-term tradeoff
4. Card synergy
5. Practical learning feedback
6. Replayability
7. Workplace realism

## Fun Rules

Avoid simple right/wrong quiz design.

Good choices should often have a cost.
Risky choices should sometimes look attractive in the short term.
Players should make decisions under incomplete information, time pressure, relationship pressure, missing evidence, or organizational risk.

Before marking a feature complete, check:

1. Does this create a real player decision?
2. Does this create tension, strategy, reward, or useful feedback?
3. Does this avoid becoming a static training screen?
4. Does this support a 10–15 minute playable loop?
5. Does it make the next card, turn, node, or choice more interesting?

## Learning Rules

The game should reinforce practical compliance behaviors, such as:

- identifying risk signals
- pausing before acting
- asking clarifying questions
- checking policy
- documenting facts
- escalating appropriately
- refusing unsafe requests
- protecting confidential or personal information
- managing conflicts of interest
- avoiding retaliation
- seeking approval when needed

Educational feedback should be:

- short
- contextual
- practical
- non-preachy
- not written as legal advice

All compliance content is generic training material and should be reviewed by legal/compliance subject-matter experts before real deployment.

## Engineering Principles

- Keep game logic separate from UI/presentation code.
- Keep content data separate from game logic.
- Prefer data-driven cards, scenarios, events, rewards, and feedback.
- Prefer small, testable functions for core rules.
- Avoid hardcoding cards or scenario content inside UI components.
- Keep each ticket focused.
- Do not introduce unrelated refactors.
- Do not add dependencies unless clearly justified.
- Preserve existing tests.
- Add or update tests for pure game logic when applicable.
- Prefer simple architecture over clever architecture.

## Scope Control

Use `docs/PROJECT_BRIEF.md` as context and guardrails.

Do not implement everything described in the brief unless the current ticket explicitly asks for it.

If a ticket conflicts with the brief:
1. follow the specific ticket,
2. preserve the current architecture,
3. mention the conflict in the summary.

## MVP Non-Goals

Do not implement these unless explicitly requested:

- backend server
- user accounts
- authentication
- payment
- multiplayer
- complex procedural generation
- advanced animation framework
- analytics SDK
- external API integrations
- legal advice engine
- large content management system
- LMS/SCORM integration
- mobile app packaging
- localization system
- cloud save or sync

## Definition of Done

A ticket is done when:

- The requested behavior works.
- The implementation stays within MVP scope.
- The code follows the current architecture.
- Build/typecheck/test commands pass where applicable.
- Manual test steps are possible.
- The feature supports player choice, learning, or the core playable loop.
- The summary lists changed files, tests run, and remaining risks.
