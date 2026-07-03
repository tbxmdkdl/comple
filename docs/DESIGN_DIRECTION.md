# DESIGN_DIRECTION.md

## 1. 디자인 목표

이 프로젝트는 퀴즈 앱, 정적 교육 슬라이드, 전투 게임이 아니다.

목표는 직장 내 컴플라이언스 리스크 상황을 카드 기반 의사결정 게임으로 바꾸는 것이다. 플레이어는 제한된 주의력과 시간 안에서 리스크, 증거, 신뢰, 압박을 관리하며 실무적으로 어떤 대응을 할지 선택한다.

화면과 상호작용은 "정답을 고르는 교육 화면"보다 "불완전한 정보 속에서 판단하는 짧은 전략 게임"처럼 느껴져야 한다.

## 2. 레퍼런스 해석 원칙

이 프로젝트는 카드 기반 deckbuilding roguelite의 구조적 매력을 참고할 수 있다. 단, 특정 상업용 게임의 이름, UI, 카드 프레임, map visual, 용어, 캐릭터, 전투 언어, 아이콘, 문구, 고유한 시각 정체성은 복사하지 않는다.

| Reference pattern | What we borrow structurally | How we reinterpret it for compliance training | What we must not copy |
| --- | --- | --- | --- |
| Short run structure | 10~15분 안에 끝나는 반복 가능한 플레이 | 여러 직장 딜레마를 짧은 run으로 해결하고 최종 리포트를 받는다 | 특정 게임의 run pacing, node naming, progression identity |
| Card hand decisions | 매 턴 손패에서 제한된 선택을 한다 | 카드가 질문, 기록, 정책 확인, 승인 요청, 에스컬레이션 같은 실무 행동이 된다 | 카드명, 카드 프레임, 카드 layout, 고유한 rarity 표현 |
| Limited turn resource | 한 턴에 쓸 수 있는 자원이 제한된다 | Attention 또는 Time을 사용해 모든 좋은 행동을 동시에 할 수 없게 한다 | energy icon, combat resource terminology, 특정 UI 배치 |
| Visible upcoming intent | 다음 압박이나 위험 신호를 미리 보여준다 | 상급자 압박, 일정 압박, 데이터 노출 가능성, 감사 리스크를 예고한다 | enemy intent icon, attack preview, monster behavior language |
| Risk-reward tradeoff | 단기 이익과 장기 위험 사이에서 고른다 | 빠른 처리, 관계 유지, 증거 확보, 리스크 감소 사이의 비용을 만든다 | attack/block/damage framing, combat math presentation |
| Deck growth | 보상으로 덱이 점차 변한다 | 좋은 습관, 정책 지식, 내부 통제, 승인 루트, 대응 카드가 추가된다 | 특정 deck archetype, relic wording, card upgrade visual identity |
| Event choices | 짧은 비전투 선택이 run에 영향을 준다 | 회의 전 준비, 내부 상담, 문서 정리, 우려 공유 같은 업무 이벤트로 바꾼다 | event node art, map structure, exact choice cadence |
| Reward selection | 성공 후 보상을 선택한다 | 새 대응 카드, passive habit, 정책 지식, 신뢰 회복 기회를 고른다 | reward screen layout, exact 1-of-3 visual treatment if identifiable |
| Final run result screen | 플레이 결과를 요약한다 | 리스크 관리 스타일, 강점, 취약점, 추천 학습 주제를 보여준다 | victory/defeat framing, score screen identity, copied wording |

## 3. 차용 금지 항목

다음 요소는 직접 복사하거나 쉽게 연상되게 만들지 않는다.

- Commercial game names
- Card frames
- Map layout
- Combat terminology
- Enemy/attack/block language
- Icons
- Character concepts
- UI layout
- Visual identity
- Card names
- Exact progression structure
- Wording

이 프로젝트의 표현은 workplace compliance, risk handling, evidence, trust, pressure, attention을 중심으로 새로 만든다.

## 4. 고유 디자인 콘셉트

권장 콘셉트는 "업무 리스크 상황판"에 가까운 현대적이고 전략적인 카드 UI다. 플레이어는 전투장이 아니라, 복잡한 업무 요청과 압박을 정리하는 decision board 앞에 앉아 있는 느낌을 받아야 한다.

무드는 다음을 목표로 한다.

- Professional
- Tense but not dark
- Strategic
- Clear
- Modern corporate
- Slightly game-like
- Not childish
- Not fantasy combat

시각적으로는 기업용 dashboard의 명료함과 카드 게임의 손맛을 결합하되, 장식보다 판단에 필요한 정보 위계를 우선한다.

## 5. 플레이어 판타지

플레이어는 유능한 직원, 팀 리드, 프로젝트 담당자처럼 느껴져야 한다.

플레이어가 느껴야 하는 것:

- 압박 속에서도 판단할 수 있다.
- 비즈니스 요구와 컴플라이언스 리스크를 함께 고려한다.
- 자신, 고객, 동료, 회사를 보호한다.
- 완벽한 선택이 아니라 더 나은 대응을 찾아간다.
- 기록, 확인, 상의, 거절, 에스컬레이션의 타이밍이 중요하다.

피해야 할 판타지:

- Hero combat fantasy
- Police/investigator fantasy, 단 가벼운 감사 또는 검토 맥락은 가능
- Legal expert fantasy
- Childish classroom quiz mood

## 6. 공통 화면 디자인 원칙

### Title / Start screen

- 긴 설명보다 바로 run을 시작할 수 있는 구성을 우선한다.
- 게임의 핵심이 "업무 리스크 판단"임을 짧은 한국어 문구로 전달한다.
- 첫 화면부터 퀴즈 앱이나 교육 슬라이드처럼 보이지 않게 한다.

### Scenario screen

- 현재 시나리오, 리스크 신호, 자원, 손패, 최근 결과가 한눈에 들어와야 한다.
- 플레이어가 "지금 어떤 압박이 있고 무엇을 할 수 있는지" 빠르게 이해해야 한다.

### Card hand area

- 손패는 주요 상호작용 영역이다.
- 카드 이름, 비용, 효과가 작은 화면에서도 읽혀야 한다.
- 선택할 수 없는 카드는 이유를 명확히 보여준다.

### Resource/status area

- Risk, Evidence, Trust, Pressure, Attention 또는 Time을 일관된 위치에 둔다.
- 숫자 변화가 즉시 이해되도록 색상, 아이콘, 짧은 레이블을 함께 사용한다.

### Pressure or intent preview

- 다음 턴 또는 다음 선택에서 예상되는 압박을 보여준다.
- "상급자 압박 증가", "증거 부족 시 리스크 상승"처럼 실무 언어를 사용한다.
- 적의 공격 예고처럼 보이게 만들지 않는다.

### Reward screen

- 보상은 전략적 선택으로 보여야 한다.
- 각 보상이 다음 시나리오에서 어떤 대응 스타일을 강화하는지 짧게 드러낸다.

### Event screen

- event는 짧은 업무 상황 선택이어야 한다.
- 긴 교육 문단보다 선택과 결과의 tradeoff를 우선한다.

### Final report screen

- 성공과 실패 모두 학습 가능한 결과로 보여준다.
- 리스크 관리 스타일, 강점, 약점, 추천 학습 주제를 짧게 요약한다.
- 법률 판단이나 징계 판단처럼 쓰지 않는다.

## 7. 시나리오 화면 구조

시나리오 화면은 퀴즈가 아니라 의사결정 상황처럼 느껴져야 한다.

표시해야 할 정보:

- Scenario title
- Situation summary
- Current pressure/risk signal
- Player resources
- Hand cards
- Expected or recent effects
- Short feedback
- End turn / resolve action

상황 설명은 짧고 구체적으로 쓰며, 숨은 리스크 신호와 현실적인 업무 이유를 함께 담는다.

## 8. 카드 UI 원칙

각 카드는 판단 도구처럼 보여야 하며 answer button처럼 보이면 안 된다.

카드에 명확히 보여야 할 정보:

- Korean card name
- Cost
- Category
- Effect
- Tradeoff or condition when relevant
- Compliance topic
- Short feedback or learning intent when needed

카드 효과는 단순히 "좋음"이 아니라 상황에 따라 가치가 달라져야 한다. 예를 들어 `정책 확인`은 즉시 리스크를 크게 줄이지 못할 수 있지만, 이후 `승인 요청`이나 `에스컬레이션`을 강화할 수 있다.

## 9. 리소스/자원 시각화 원칙

자원은 장식이 아니라 의사결정을 돕는 정보다.

- Risk: 높아질수록 실패나 부정적 결과에 가까워진다는 점이 즉시 보여야 한다.
- Evidence: 기록, 사실, 승인 근거가 쌓였는지 보여준다.
- Trust: 관계와 신뢰가 손상되거나 회복되는 흐름을 보여준다.
- Pressure: 일정, 상급자, 성과, 관계 압박이 커지는 느낌을 준다.
- Attention or Time: 한 턴에 모든 행동을 할 수 없게 만드는 제한 자원으로 보여준다.

색상만으로 상태를 전달하지 말고, 숫자, 레이블, 짧은 변화 메시지를 함께 사용한다.

## 10. 재미를 만드는 UI 원칙

UI는 다음 재미를 강화해야 한다.

- Meaningful choice
- Risk-reward tension
- Card synergy
- Short-term vs long-term tradeoff
- Visible consequences
- Replay motivation

피해야 할 UI:

- Multiple-choice quiz
- Policy document reader
- Static e-learning slide
- Legal checklist

플레이어가 카드를 낸 뒤 "다음에는 다른 순서로 해볼까?"라고 생각하게 만드는 것이 좋은 UI다.

## 11. 피드백 표시 원칙

피드백은 플레이 흐름을 크게 끊지 않으면서 짧게 보여준다.

피드백은 다음 조건을 지킨다.

- Short
- Contextual
- Korean
- Practical
- Not preachy
- Not legal advice

좋은 피드백은 "왜 이 선택이 도움이 됐는지"와 "다음에 무엇을 고려할지"를 알려준다. "정답입니다"나 "틀렸습니다"만 표시하지 않는다.

## 12. MVP 비주얼 범위

2-week MVP에서는 완성된 시각 시스템보다 읽기 쉬운 카드와 완성된 playable loop가 우선이다.

MVP에서 허용되는 범위:

- Simple layout is acceptable
- No complex animation
- No custom illustration dependency
- No audio requirement
- No advanced map art
- No complex theme system
- Prioritize readable cards and playable loop

MVP의 시각 목표는 "데모 가능한 명료함"이다. 고급 polish는 core loop가 안정된 뒤에만 다룬다.

## 13. 향후 확장 가능성

나중에 개선할 수 있는 디자인 요소:

- Better animations
- Stronger visual theme
- Scenario illustrations
- Improved card rarity visuals
- Run map polish
- Report dashboard polish

단, 위 항목은 MVP에서 명시적으로 요청되지 않는 한 구현하지 않는다. 지금 단계의 디자인 문서는 미래 확장을 막지 않되, 현재 ticket의 scope를 넓히는 근거로 사용하지 않는다.
