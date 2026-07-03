# MVP Tickets 01–12

These are starter tickets. Adapt file paths after the stack is chosen.

Do not run multiple tickets at once.

---

## Ticket 01 — Plan First: Choose Stack and Project Architecture

Use prompt file: `prompts/00_PLAN_FIRST_NO_CODE.txt`

No code should be written in this ticket.

---

## Ticket 02 — Initialize Project

Use prompt file: `prompts/01_INITIALIZE_PROJECT.txt`

Expected result:
- project scaffold exists
- app runs
- build passes
- AGENTS.md updated with actual commands

---

## Ticket 03 — Core Types and Data Model

Goal:
Define the core game types/data model.

Expected concepts:
- Card
- CardEffect
- CardTag
- Scenario
- ScenarioIntent or pressure signal
- PlayerState
- RunState
- Reward
- Passive/Upgrade
- LearningFeedback
- DecisionLog

Done when:
- types are defined in the appropriate game/domain folder
- imports compile
- no UI behavior required yet

---

## Ticket 04 — Initial Content Data

Goal:
Create initial data-driven content.

Expected content:
- 20–24 cards
- 5–6 scenarios
- 4–6 feedback snippets
- 4–6 reward/passive examples

Done when:
- content is in data files, not UI components
- content validates against the types
- copy is short and non-legal-advice-like

---

## Ticket 05 — Deck/Hand/Discard Engine

Goal:
Implement pure game logic for deck operations.

Functions may include:
- createStartingDeck
- shuffle
- drawCards
- discardCard
- discardHand
- reshuffleDiscardIntoDraw
- exhaustCard if needed

Done when:
- pure functions exist
- tests cover draw/discard/reshuffle
- no UI dependency

---

## Ticket 06 — Scenario/Action Resolution Engine

Goal:
Implement pure game logic for playing cards into a scenario.

Systems:
- attention/time cost
- risk
- evidence
- trust
- pressure
- scenario outcome
- action log

Done when:
- a scenario can be simulated through functions
- tests cover playing a valid card, insufficient resources, scenario success/failure

---

## Ticket 07 — First Playable Scenario UI

Goal:
Connect the engine to a minimal UI for one playable scenario.

UI should show:
- scenario title/setup
- risk/pressure/evidence/trust/attention
- hand cards
- card effects
- feedback log
- end turn or resolve action

Done when:
- user can play at least one scenario from start to resolution
- build passes
- no reward/run progression required yet

---

## Ticket 08 — Reward Choice

Goal:
Add a simple post-scenario reward choice.

Expected:
- show 3 card choices
- pick 1
- selected card is added to the deck
- continue button returns to next state

Done when:
- reward appears after scenario success
- selected card affects future deck
- no complex balancing required

---

## Ticket 09 — Short Run Progression

Goal:
Create a short sequence of nodes.

Expected:
- start run
- scenario → reward → scenario → event/reward → final scenario
- fixed sequence is acceptable

Done when:
- player can progress through multiple scenarios
- run state persists during the session
- no branching map required

---

## Ticket 10 — Events

Goal:
Add short non-scenario decision events.

Expected:
- event data file
- 2–3 choices per event
- choices modify risk/evidence/trust/pressure/deck

Done when:
- at least 3 events can appear in the run
- choices create meaningful tradeoffs
- no long training pages

---

## Ticket 11 — Final Report

Goal:
Create final learning report.

Expected:
- score/grade
- strongest behavior
- weakest behavior
- key decisions
- recommended topics
- replay button

Done when:
- completing or failing the final scenario leads to report
- report is based on decision log and metrics
- failure still produces useful learning feedback

---

## Ticket 12 — QA, Balance, and Polish

Goal:
Make the MVP playable end-to-end.

Expected:
- build/test pass
- full playthrough works
- no dead ends
- card text clearer
- obvious balance issues reduced
- brief README instructions

Done when:
- user can complete a 10–15 minute run
- project is ready for internal demo
