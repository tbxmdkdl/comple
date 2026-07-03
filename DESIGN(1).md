# DESIGN.md — Red Flag Quest

## 1. Purpose

This document defines the visual and interaction design direction for **Red Flag Quest**, a pixel-art compliance decision game.

The game must feel like a playable pixel RPG-inspired card decision game, not a static corporate training quiz. The player should feel that they are entering small workplace scenes, reading social pressure, choosing response cards, and managing visible and hidden risks.

This document is written in English so coding agents can follow it reliably. All user-facing explanations in chat to the project owner must be written in Korean.

---

## 2. Design Intent

### One-line design target

A compact, readable, colorful pixel-art workplace where compliance dilemmas appear as live incidents, and the player resolves them through card-based decisions.

### Core visual fantasy

The player is a practical risk-response specialist moving through a miniature corporate world. Each scene contains NPCs, props, warning signs, and pressure cues. The cards are not answer buttons; they are workplace actions with cost, timing, tradeoffs, and consequences.

### Emotional tone

- Friendly, approachable, and game-like.
- Slightly tense when risk rises.
- Corporate and realistic enough for compliance education.
- Never too dark, punitive, legalistic, or police-like.
- Never a direct clone of any commercial pixel game or deckbuilding game.

---

## 3. Reference Interpretation

The user-provided reference images suggest the following inspiration points:

- Small, readable pixel characters.
- Dense but clear pixel environments.
- A visible HUD with status indicators.
- A bottom action area that feels game-like.
- Bright, clean color groups.
- Strong silhouettes and simple animations.
- A scene-first presentation where the player feels located in a world.

Use these references only as mood and production inspiration. Do not recreate their exact UI, sprites, palette, map layout, combat structure, card frame, icons, characters, or camera composition.

### What to borrow as abstract principles

- Pixel clarity.
- Strong top-level HUD readability.
- Bottom interaction bar structure.
- Small character reactions.
- Scene props that hint at risk.
- Compact but expressive UI.

### What not to borrow

- Exact card shapes or frames from existing games.
- Exact sprite proportions or animation cycles.
- Exact HUD arrangement from any reference.
- Combat UI, attack effects, damage numbers, enemy staging, or map nodes from commercial deckbuilders.
- Any specific named card, icon, visual asset, text style, or character design from commercial games.

---

## 4. Visual Pillars

### Pillar 1: Corporate Pixel Diorama

Each scenario should feel like a tiny workplace diorama. The scene should provide context before the player reads the full scenario text.

Examples:

- A gift box near a lobby desk.
- A spreadsheet on an office monitor.
- A conference table with evaluation sheets.
- A server rack with a blinking warning light.
- A private HR room with muted colors.

### Pillar 2: Readable Risk at a Glance

The player should always understand the state of the run through visible meters and icons.

Required top-level indicators:

- Time.
- Focus.
- Trust.
- Reputation.
- Evidence.
- Pressure.
- Manager Support.
- Reporting Channel Trust.
- Policy Risk.
- Data/Security Risk.
- People/Culture Risk.
- Finance/Trade Risk.
- Personal Liability Risk.
- Audit Debt.

The UI may group indicators to avoid clutter.

### Pillar 3: Cards as Workplace Actions

Cards must look like actionable workplace response cards, not fantasy spells or attack cards.

Card visual language:

- Case-file inspired.
- Small icon at top.
- Category badge.
- Cost row.
- Immediate effect.
- Long-term effect or drawback.
- Synergy hint.
- Misuse warning.

### Pillar 4: Consequences Become Visible

Card choices should create visible scene reactions:

- A warning icon dims.
- A document stamp appears.
- An NPC changes expression.
- A server lock icon closes.
- A message bubble shakes.
- A risk delta floats briefly.

The visual feedback should reinforce the game state, not distract from decision-making.

### Pillar 5: Education Without Lecturing

The player should not be stopped by long lectures after each move. Feedback should be short during the run and more detailed in the final report.

During play:

- One short feedback sentence.
- A clear state change.
- A visible consequence.

Final report:

- Stronger learning summary.
- Top three decision moments.
- Recommended next strategy.

---

## 5. Screen Layout

### MVP layout

Use a single main play screen with four stacked areas.

```txt
┌──────────────────────────────────────────────┐
│ Top HUD: resources, risks, audit debt         │
├──────────────────────────────────────────────┤
│ Pixel Scene: location, NPCs, props, warnings  │
├──────────────────────────────────────────────┤
│ Scenario / dialogue / pressure panel          │
├──────────────────────────────────────────────┤
│ Card hand / selected cards / action buttons   │
└──────────────────────────────────────────────┘
```

### Recommended proportions

- Top HUD: 12-16% of height.
- Pixel scene: 36-45% of height.
- Scenario panel: 16-20% of height.
- Card hand: 26-32% of height.

### Responsive priority

MVP should target desktop browser first.

Recommended minimum viewport:

- 1280 x 720 for comfortable testing.
- 1024 x 640 acceptable.
- Mobile support is not required for the 2-week MVP.

---

## 6. Pixel Art Technical Direction

### Internal resolution

Recommended internal Phaser scene resolution:

- 480 x 270 for strong pixel scale and simple composition.
- 640 x 360 if the team wants more room for scene props.

For MVP, use 480 x 270 unless there is a strong reason to change it.

### Scaling

- Use integer scaling when possible.
- Disable image smoothing for pixel assets.
- Avoid subpixel movement for sprites.

### Tile size

Recommended tile sizes:

- 16 x 16 pixels for dense scenes.
- 32 x 32 pixels for faster production and larger readable props.

For MVP, use 16 x 16 tiles for pixel feel, but allow large props built from multiple tiles.

### Character sprite size

Recommended:

- 24 x 32 pixels for humans.
- 32 x 32 pixels for important NPCs.
- 16 x 16 pixels for small icons and props.

### Animation budget

For the 2-week MVP, keep animations minimal:

- Idle: 2 frames.
- Walk: optional, 4 frames only if movement exists.
- Reaction: 2 frames.
- Warning icon blink: 2 frames or tween.
- Floating text: tween only.

No complex cutscenes.

---

## 7. Color and Lighting Direction

### Base palette direction

Use a bright but controlled palette:

- Neutral office grays and blues.
- Warm wood and paper tones.
- Risk red/orange only for warnings.
- Security blue/cyan for data and system cues.
- People/culture purple or pink accents.
- Finance/trade yellow or gold accents.
- Policy red stamp accents.

### Risk color mapping

Suggested mapping:

- Policy Risk: red stamp.
- Data/Security Risk: blue lock or cyan server light.
- People/Culture Risk: purple speech bubble.
- Finance/Trade Risk: yellow contract or coin.
- Personal Liability Risk: orange ID badge.
- Audit Debt: dark red folder or black audit stamp.

### Lighting by scene

- Lobby: bright, welcoming, external-facing.
- Open Office: neutral, busy, fluorescent.
- Meeting Room: slightly warmer, formal, document-heavy.
- Server Room: cool blue, high contrast, blinking lights.
- HR Room: soft, private, muted.
- Vendor Site: practical, slightly rougher, industrial accents.

MVP should implement four scenes first: Lobby, Open Office, Meeting Room, Server Room.

---

## 8. Scene Design

### 8.1 Lobby

Purpose:

- External visitors, gifts, partner contact, reception pressure.

Visual elements:

- Reception desk.
- Visitor badge stand.
- Gift box prop.
- Company logo placeholder.
- Elevator or glass door.

Risk cues:

- Gift box glows when gift/anti-bribery risk rises.
- Visitor badge icon blinks when external access risk appears.

### 8.2 Open Office

Purpose:

- Expense processing, manager requests, informal pressure, spreadsheets.

Visual elements:

- Desks.
- Monitors.
- Chat bubbles.
- Receipt pile.
- Calendar deadline marker.

Risk cues:

- Spreadsheet icon shakes when finance/trade risk rises.
- Manager NPC becomes visually impatient when pressure rises.

### 8.3 Meeting Room

Purpose:

- Vendor evaluation, price conversation, approval, decision records.

Visual elements:

- Conference table.
- Evaluation sheets.
- Projector.
- Whiteboard.
- Name plates.

Risk cues:

- Evaluation sheet warning icon.
- Meeting minutes stamp when record cards are used.

### 8.4 Server Room

Purpose:

- Data sharing, access control, security exceptions, logs.

Visual elements:

- Server racks.
- Lock icons.
- Blinking red light.
- Cable bundles.
- Admin console.

Risk cues:

- Server light turns red when Data/Security Risk is high.
- Lock icon closes when access control cards are used.

---

## 9. UI Components

### 9.1 Top HUD

The HUD must be readable at a glance. Do not show every number with equal visual weight.

Recommended grouping:

- Work Capacity: Time, Focus.
- Social Capital: Trust, Reputation, Manager Support, Reporting Channel Trust.
- Case Strength: Evidence.
- Tension: Pressure.
- Risk Board: four main organizational risks, Personal Liability, Audit Debt.

Use icons and short labels. Use tooltips for longer explanations.

### 9.2 Scenario Panel

Scenario panel should show:

- Scenario title.
- Speaker or NPC name.
- Short situation text.
- Pressure elements.
- Revealed risk signals.

Rules:

- Do not display long training paragraphs.
- Prioritize active dilemma and pressure.
- Keep text scannable.

### 9.3 Card View

Each card should include:

- Card name.
- Category badge.
- Cost row.
- Immediate effect.
- Long-term effect or drawback.
- Strong situation hint.
- Weak situation hint.
- Synergy hint.
- Misuse warning, if relevant.

Card dimensions should be consistent. The card must remain readable at MVP screen size.

### 9.4 Selected Cards Bar

Show selected cards in order. Order matters for combos.

The selected cards bar should show:

- Slot 1, Slot 2, Slot 3.
- Combo hint if a known sequence is possible.
- Total cost.
- Resolve button.

### 9.5 Result Panel

After resolving cards, show:

- Outcome type.
- One short feedback sentence.
- Resource/risk delta summary.
- Combo names triggered.
- Continue button.

Avoid long text here.

### 9.6 Reward Picker

Reward choices should clearly imply strategy.

Each reward card should show:

- Reward name.
- Type: Card, Passive, Upgrade, Remove, Recover.
- Effect summary.
- Build hint.
- Short tradeoff, if any.

### 9.7 Final Report

Final report should look like an audit summary but remain game-like.

Show:

- Grade stamp.
- Score.
- Risk breakdown.
- Strengths.
- Weaknesses.
- Top three decision moments.
- Recommended next strategy.
- Challenge badges.

Do not make the final report feel like a legal judgment.

---

## 10. Card Visual Style

### Card metaphor

Cards should feel like workplace case-action cards, not attacks or spells.

Visual metaphors:

- Folder.
- Memo.
- Checklist.
- Approval slip.
- Security badge.
- Meeting note.
- Audit stamp.

### Card category colors

Suggested category accents:

- Observation: green.
- Question: teal.
- Record: beige or paper yellow.
- Refusal: orange.
- Consult: blue.
- Report: navy.
- Approval: gold.
- Education: light purple.
- Audit Response: dark red.
- Relationship: pink.
- Information Protection: cyan.
- Conflict Management: amber.

These are accents only. Do not over-color entire cards.

### Do not use

- Fantasy mana or attack iconography.
- Sword, fireball, monster, combat damage metaphors.
- Exact visual structure of any commercial deckbuilder card.
- Card rarity frames that imply collectible monetization.

---

## 11. Feedback and Motion Rules

### Required micro-feedback

When a card resolves, show at least one of:

- Floating resource delta.
- Floating risk delta.
- NPC reaction.
- Warning icon state change.
- Small document stamp.

### Motion budget

MVP motion must be simple:

- Fade in/out.
- Small bounce.
- Pixel icon blink.
- Floating text.
- Sprite frame swap.

No complex physics, particle systems, or long animations.

### Feedback mapping

- Evidence gain: paper or stamp pop.
- Pressure gain: shaking speech bubble.
- Trust loss: NPC turns away or neutral expression.
- Trust gain: NPC nod or small sparkle.
- Data/Security risk decrease: lock closes.
- Audit Debt increase: dark folder appears briefly.

---

## 12. Accessibility and Readability

### Text

- Do not rely on tiny pixel fonts for all text.
- Use a readable UI font for Korean text in the actual game.
- Pixel-style headings are acceptable, but body text must be readable.
- Avoid all-caps paragraphs.

### Color

- Do not rely on color alone.
- Pair risk colors with icons and labels.
- High risk should use icon, label, and motion.

### Interaction

- Click selection is enough for MVP.
- Drag-and-drop is optional and should not be built in the first MVP.
- Keyboard support is optional but preferred for buttons.

---

## 13. Asset Budget for 2-Week MVP

### Required assets

- 4 scene backgrounds or tile-based scene layouts.
- 1 player sprite.
- 6 NPC sprites.
- 20 props.
- 12 category icons.
- 6 risk icons.
- 8 feedback icons/effects.
- Card frame UI.
- HUD frame UI.
- Result stamp UI.

### Acceptable placeholders

For early development, simple colored rectangles and icon placeholders are acceptable.

Do not block core game development on final art.

### Asset priority

1. HUD icons.
2. Card readability.
3. Scene backgrounds.
4. NPC reactions.
5. Prop detail.
6. Decorative polish.

---

## 14. Asset Naming Convention

Use stable English names.

```txt
assets/
  pixel/
    scenes/
      lobby.png
      open_office.png
      meeting_room.png
      server_room.png
    sprites/
      player_idle.png
      npc_manager_idle.png
      npc_hr_idle.png
      npc_security_idle.png
      npc_legal_idle.png
      npc_vendor_idle.png
    icons/
      risk_policy.png
      risk_data_security.png
      risk_people_culture.png
      risk_finance_trade.png
      resource_evidence.png
      resource_pressure.png
    ui/
      card_frame.png
      hud_panel.png
      report_stamp.png
```

Use manifest data for assets when possible.

```json
{
  "scene_lobby": "assets/pixel/scenes/lobby.png",
  "icon_risk_policy": "assets/pixel/icons/risk_policy.png"
}
```

---

## 15. React and Phaser Responsibilities

### React owns

- Card UI.
- HUD UI.
- Scenario text.
- Result panel.
- Event choices.
- Reward picker.
- Final report.
- Accessibility-friendly text.

### Phaser owns

- Pixel scene background.
- NPC sprites.
- Props.
- Warning icons.
- Simple visual reactions.
- Floating text.

### Shared state

Use the game store as the bridge. Phaser should read display state and emit simple events only when necessary. Do not implement game rules inside Phaser scenes.

---

## 16. Visual Definition of Done

A screen is visually acceptable for MVP when:

- The player can identify the current location.
- The current scenario pressure is visible.
- The hand cards are readable.
- High risk is visually noticeable.
- Selected card order is clear.
- Result deltas are visible after resolving.
- The screen does not look like a plain quiz form.

---

## 17. Fun Validation Checklist

Use this checklist during implementation:

- Does the first minute show an incident and choices, not a long tutorial?
- Does the scene make the scenario feel more concrete?
- Does at least one visible meter create pressure?
- Does the card UI show both benefit and cost?
- Does selected card order matter?
- Does feedback show consequences without pausing the game too long?
- Does the reward screen suggest a strategy for the next scenario?
- Does the final report make the player want to retry?

---

## 18. Compliance Tone Rules

The game must teach practical judgment, not legal certainty.

Avoid:

- Definitive legal claims.
- Punitive wording.
- Shaming the player.
- Overly formal policy paragraphs during active play.
- Scenarios with obvious villains.

Prefer:

- Practical business language.
- Tradeoffs.
- Evidence-based reasoning.
- Short feedback.
- Final report recommendations.
- “This may depend on company policy and jurisdiction” framing in supporting materials.

---

## 19. IP Safety Rules

Do not copy commercial game elements.

Do not copy:

- Exact card frames.
- Exact HUD layout.
- Exact sprite proportions.
- Exact palettes.
- Exact icons.
- Exact map layout.
- Exact combat structure.
- Exact terminology.
- Exact animation sequences.

Use the reference only to understand the desired production feel: compact pixel scenes, readable HUD, bottom interaction bar, and expressive small sprites.

---

## 20. MVP Visual Scope Freeze

For the first playable MVP, do not add:

- Full RPG movement.
- Combat.
- Enemies.
- Path maps.
- Complex cutscenes.
- Large animated backgrounds.
- Mobile-specific UI.
- Cosmetic skins.
- Advanced lighting.
- Particle-heavy effects.

Build the smallest version that proves the game can be fun, readable, and educational.
