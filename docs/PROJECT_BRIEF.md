# Compliance Card Game MVP — Project Brief

## 1. One-Line Concept

A short card-based compliance decision game where players navigate realistic workplace dilemmas by balancing risk, evidence, trust, pressure, and limited attention.

## 2. Product Goal

Create a 10–15 minute playable MVP that helps employees practice compliance judgment through meaningful choices rather than memorizing quiz answers.

The player should feel:

- "I understand the situation."
- "There is no perfect option."
- "I need to manage risk with limited resources."
- "My card choices and timing matter."
- "I learned why a response was safer or riskier."

## 3. Player Fantasy

The player is a capable employee, team lead, or project owner trying to get work done while protecting the organization, colleagues, customers, and themselves from compliance risk.

The fantasy is not combat.
The fantasy is professional judgment under pressure.

## 4. Core Experience

The player faces a workplace situation such as:

- a vendor offering a questionable gift
- a manager pressuring them to adjust expenses
- a colleague asking for personal data through an unsafe channel
- a conflict of interest that is easy to ignore
- a concern about retaliation after speaking up
- a rushed approval request with missing evidence

The player uses cards representing professional actions:

- ask a clarifying question
- check policy
- document facts
- request approval
- consult a manager
- escalate to compliance
- refuse unsafe action
- preserve evidence
- reduce pressure
- protect confidentiality
- repair trust

## 5. Core Game Loop

1. Start a run.
2. Draw a hand of action cards.
3. Read the current workplace scenario and its pressure/risk signals.
4. Spend limited resources to play cards.
5. Cards change risk, evidence, trust, pressure, or escalation state.
6. The scenario responds or escalates.
7. The player resolves or fails the situation.
8. The player receives a reward, new card, passive benefit, or event choice.
9. Repeat through a short sequence of scenarios.
10. End with a learning report summarizing decisions, strengths, weaknesses, and recommended topics.

## 6. MVP Session Structure

Target MVP run:

- 1 intro/title screen
- 1 simple run flow
- 5–8 scenario nodes
- 1 final high-pressure scenario
- 20–30 cards
- 5–8 passive rewards or upgrades
- 4–6 short events
- 1 final learning report

A fixed sequence is acceptable for MVP.
A branching map is optional and should not block the core loop.

## 7. Primary Resources

The exact names can change based on implementation, but the MVP should include some version of these resources.

### Attention or Time

Represents limited capacity per turn.
Used to play cards.
Creates tradeoffs.

### Risk

Represents unresolved compliance exposure.
If risk gets too high, the situation fails or creates negative consequences.

### Evidence

Represents documentation, facts, approvals, and traceability.
Protects the player during escalation or final review.

### Trust or Relationship

Represents credibility, working relationship, or stakeholder confidence.
Some safe choices may cost trust in the short term.

### Pressure

Represents urgency, hierarchy pressure, social pressure, or business pressure.
If unmanaged, pressure can make future turns harder.

## 8. Card Design Rules

Cards should not be simple correct answers.

A good card should have at least two of these:

- resource cost
- conditional effect
- synergy with another card
- immediate benefit but future drawback
- short-term cost but long-term benefit
- strong use case and weak use case
- risk reduction at the cost of trust, time, or pressure
- stronger effect when evidence or policy is already established
- drawback when used too early or too often

## 9. Card Categories

Use these as design categories, not necessarily UI labels:

- Observe
- Ask
- Check Policy
- Document
- Consult
- Escalate
- Refuse
- Protect Data
- Manage Conflict
- Preserve Evidence
- Repair Trust
- Prepare Audit

## 10. Example Card Patterns

These are design patterns, not mandatory exact cards.

### Ask Clarifying Question

- Low cost
- Reveals information or reduces uncertainty
- May not reduce risk immediately
- Strong early in ambiguous scenarios

### Document the Request

- Builds evidence
- Helps later escalation
- May increase pressure or reduce trust if overused

### Check Policy

- Reduces uncertainty
- Enables stronger follow-up cards
- Costs time or attention

### Request Approval

- Reduces personal risk
- Requires enough evidence
- May delay progress

### Escalate to Compliance

- Strong risk reduction
- Works best with evidence
- Can cost trust or increase pressure if used prematurely

### Refuse Unsafe Action

- Strong immediate protection
- Can cost relationship/trust
- Best when risk is clear

### Preserve Confidentiality

- Strong in data/security scenarios
- May slow business process
- Combines well with safe-channel alternatives

## 11. Scenario Design Rules

Scenarios should feel like realistic workplace dilemmas.

Each scenario should include:

- practical business reason behind the request
- incomplete information
- at least one hidden or subtle risk signal
- pressure from time, hierarchy, relationship, or performance goals
- more than one possible strategy
- short-term tempting option
- long-term safer option
- consequences connected to player choices

Avoid scenarios where the only correct answer is obvious from the start.

## 12. Scenario Topics

Use these as content direction:

1. Vendor gift or hospitality pressure
2. Personal data sharing request
3. Expense or accounting manipulation pressure
4. Conflict of interest disclosure
5. Confidential information rumor
6. Retaliation or reporting concern
7. Rushed third-party onboarding
8. Suspicious shortcut to meet sales target
9. Informal request to bypass approval
10. Sensitive customer information in an unsafe channel

## 13. Event Design

Events should be short non-scenario choices that affect the run.

Good event choices might:

- add or remove a card
- gain evidence
- lose time but reduce future risk
- increase trust but add pressure
- unlock a safer future option
- trade short-term efficiency for long-term protection

Events should not become long training pages.

## 14. Reward Design

Rewards should support strategy.

Possible reward types:

- choose 1 of 3 new cards
- upgrade a card
- gain a passive benefit
- remove a weak card
- gain starting evidence
- reduce future pressure
- improve escalation effectiveness
- gain policy knowledge that improves certain cards

Reward choices should make the player think about their deck and future risk profile.

## 15. Passive / Upgrade Design

Passive benefits should create run identity.

Examples:

- first policy check each scenario costs less
- escalation is stronger when evidence is high
- documenting facts also reduces pressure
- refusing unsafe actions costs less trust
- data-protection cards draw an extra card
- first mistake each run is softened
- event choices reveal more information

## 16. Learning Feedback

Feedback should appear after important actions or scenario resolution.

Good feedback:

- "Documenting the request creates traceability before escalation."
- "Escalation is stronger when supported by facts."
- "A fast workaround may solve the business problem but increase privacy risk."
- "Asking a clarifying question can reveal whether a request is legitimate or risky."

Avoid:

- long lectures
- legal conclusions
- jurisdiction-specific claims
- shaming the player
- generic "Correct!" or "Wrong!" messages

## 17. Final Report

The final report should summarize:

- final score or grade
- risk management style
- strongest behavior
- weakest behavior
- key decisions
- recommended learning topics
- practical takeaways

The report should make failure useful.
Even if the player loses, they should understand what to try differently next time.

## 18. Technology Selection

Do not lock technology before evaluation.

The chosen stack should be selected based on:

1. 2-week MVP feasibility
2. card UI implementation ease
3. game state management simplicity
4. Codex readability and maintainability
5. testability
6. static deployment ease
7. content-data separation
8. future expansion potential

Candidate approaches may include:
- UI framework web app
- lightweight 2D game engine
- canvas-based game framework
- rapid prototype tool
- static web application

These are categories, not required choices.

## 19. MVP P0 Features

Highest priority:

- project runs locally
- basic title/start flow
- core types/data model
- card data
- scenario data
- deck, hand, draw, discard logic
- limited player resources
- scenario resolution
- play cards and see results
- at least one complete playable scenario
- reward choice after scenario
- short run progression
- final report
- basic tests for pure game logic
- simple but usable UI

## 20. P1 Features

Add only after the core loop works:

- more scenarios
- more cards
- more events
- card upgrades
- passive rewards
- improved balancing
- improved UI states
- lightweight animations
- better report details

## 21. P2 / Later Features

Do not build during MVP unless explicitly requested:

- complex branching map
- procedural content generation
- account system
- backend progress tracking
- admin content editor
- localization
- advanced animations
- audio
- analytics dashboard
- SCORM/LMS integration
- multiplayer or team mode
- mobile app packaging

## 22. Implementation Priority

Build in this order:

1. Choose stack and initialize project
2. Data model
3. Card data
4. Deck/hand/discard logic
5. Scenario state logic
6. Card effect resolution
7. First playable scenario
8. Reward flow
9. Run progression
10. Events
11. Passive/upgrades
12. Final report
13. Balancing and polish

## 23. Non-Copying Rule

This game may use broad genre patterns such as cards, choices, resources, rewards, and repeatable runs.

It must not copy:

- commercial game names
- UI layouts
- card names
- map visuals
- enemy/combat framing
- icons
- wording
- character concepts
- signature mechanics
- visual identity

Use workplace compliance language and original system names.

## 24. Ticket Rule for Codex

This document is reference context.

When working on a ticket, implement only that ticket.

Do not implement all systems described here unless the ticket explicitly asks for them.

If the ticket conflicts with this document, follow the ticket but mention the conflict in the summary.
