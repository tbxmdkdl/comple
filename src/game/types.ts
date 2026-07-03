export type GameId = string;

export type ResourceKey = "risk" | "evidence" | "trust" | "pressure";
export type TurnResourceKey = "attention" | "time";
export type MetricKey = ResourceKey | TurnResourceKey;

export type ComplianceTopic =
  | "approvalProcess"
  | "confidentialInformation"
  | "conflictOfInterest"
  | "dataPrivacy"
  | "expensesAccounting"
  | "giftsHospitality"
  | "retaliation"
  | "thirdPartyRisk"
  | "generalCompliance";

export type CardCategory =
  | "observe"
  | "ask"
  | "checkPolicy"
  | "document"
  | "consult"
  | "escalate"
  | "refuse"
  | "protectData"
  | "manageConflict"
  | "preserveEvidence"
  | "repairTrust"
  | "prepareAudit";

export type CardTag =
  | CardCategory
  | "earlyAction"
  | "evidenceBased"
  | "policyKnowledge"
  | "pressureControl"
  | "riskReduction"
  | "trustCost";

export type CardEffectType =
  | "adjustResource"
  | "addLearningFeedback"
  | "addScenarioSignal"
  | "conditional"
  | "recordDecision"
  | "scenarioProgress";

export type DecisionType =
  | "playCard"
  | "skipAction"
  | "resolveScenario"
  | "chooseReward"
  | "chooseEvent"
  | "startRun"
  | "finishRun";

export type ThresholdOperator = "atLeast" | "atMost" | "equals";

export interface ResourceChange {
  resource: MetricKey;
  amount: number;
  reason?: string;
}

export type CardCost = Partial<Record<TurnResourceKey, number>>;

export interface ResourceCondition {
  type: "resource";
  resource: MetricKey;
  operator: ThresholdOperator;
  value: number;
}

export interface CardTagCondition {
  type: "cardTag";
  tag: CardTag;
  operator: "has" | "lacks";
}

export interface ScenarioSignalCondition {
  type: "scenarioSignal";
  signalId: GameId;
  operator: "present" | "absent";
}

export interface PassiveCondition {
  type: "passive";
  passiveId: GameId;
  operator: "active" | "inactive";
}

export type EffectCondition =
  | ResourceCondition
  | CardTagCondition
  | ScenarioSignalCondition
  | PassiveCondition;

export interface AdjustResourceEffect {
  type: "adjustResource";
  changes: ResourceChange[];
}

export interface AddLearningFeedbackEffect {
  type: "addLearningFeedback";
  feedbackId: GameId;
}

export interface AddScenarioSignalEffect {
  type: "addScenarioSignal";
  signalId: GameId;
  intensity?: number;
}

export interface ConditionalCardEffect {
  type: "conditional";
  condition: EffectCondition;
  whenMet: CardEffect[];
  whenNotMet?: CardEffect[];
}

export interface RecordDecisionEffect {
  type: "recordDecision";
  decisionType: DecisionType;
  summary: string;
}

export interface ScenarioProgressEffect {
  type: "scenarioProgress";
  target: "success" | "failure";
  amount: number;
}

export type CardEffect =
  | AdjustResourceEffect
  | AddLearningFeedbackEffect
  | AddScenarioSignalEffect
  | ConditionalCardEffect
  | RecordDecisionEffect
  | ScenarioProgressEffect;

export interface Card {
  id: GameId;
  name: string;
  description: string;
  category: CardCategory;
  tags: CardTag[];
  cost: CardCost;
  effects: CardEffect[];
  complianceTopics: ComplianceTopic[];
  learningFeedbackId?: GameId;
}

export type ScenarioPressureType =
  | "authorityPressure"
  | "businessPressure"
  | "conflictSignal"
  | "dataExposure"
  | "missingEvidence"
  | "relationshipPressure"
  | "retaliationConcern"
  | "timePressure";

export interface ScenarioPressureSignal {
  id: GameId;
  label: string;
  description: string;
  type: ScenarioPressureType;
  severity: 1 | 2 | 3;
  visible: boolean;
}

export interface ScenarioIntent {
  id: GameId;
  label: string;
  description: string;
  pressureSignalIds: GameId[];
  projectedChanges: ResourceChange[];
  visible: boolean;
}

export interface ResourceThreshold {
  resource: ResourceKey;
  operator: Exclude<ThresholdOperator, "equals">;
  value: number;
}

export type ScenarioOutcome = "success" | "failure" | "unresolved";

export interface Scenario {
  id: GameId;
  title: string;
  summary: string;
  setup: string;
  complianceTopics: ComplianceTopic[];
  pressureSignals: ScenarioPressureSignal[];
  intents?: ScenarioIntent[];
  startingResources?: Partial<PlayerResources>;
  successThresholds: ResourceThreshold[];
  failureThresholds: ResourceThreshold[];
  turnLimit?: number;
  resolutionFeedbackIds?: Partial<Record<Exclude<ScenarioOutcome, "unresolved">, GameId>>;
  isFinal?: boolean;
}

export interface EventResourceEffect {
  type: "adjustResource";
  changes: ResourceChange[];
}

export interface EventAddCardEffect {
  type: "addCardToDeck";
  cardId: GameId;
}

export type EventEffect = EventResourceEffect | EventAddCardEffect;

export interface EventChoice {
  id: GameId;
  label: string;
  consequence: string;
  effects: EventEffect[];
}

export interface Event {
  id: GameId;
  title: string;
  description: string;
  choices: EventChoice[];
  complianceTopics: ComplianceTopic[];
}

export interface PlayerResources {
  risk: number;
  evidence: number;
  trust: number;
  pressure: number;
  attention: number;
  time?: number;
}

export interface PlayerState {
  resources: PlayerResources;
  maxAttention: number;
  maxTime?: number;
  turnResource: TurnResourceKey;
  activePassiveIds: GameId[];
  flags: string[];
}

export interface ActiveScenarioState {
  scenarioId: GameId;
  turnNumber: number;
  outcome: ScenarioOutcome;
  activeSignalIds: GameId[];
  successProgress: number;
  failureProgress: number;
}

export interface CardZoneState {
  drawPile: GameId[];
  hand: GameId[];
  discardPile: GameId[];
  removedFromRun: GameId[];
}

export type RunPhase =
  | "notStarted"
  | "scenario"
  | "reward"
  | "event"
  | "finalReport"
  | "complete";

export interface RunState {
  id: GameId;
  phase: RunPhase;
  nodeIndex: number;
  player: PlayerState;
  cardZones: CardZoneState;
  activeScenario?: ActiveScenarioState;
  availableRewardIds: GameId[];
  completedScenarioIds: GameId[];
  decisionLog: DecisionLog;
}

export type RewardType =
  | "cardChoice"
  | "passive"
  | "upgrade"
  | "removeCard"
  | "resourceBonus";

export interface RewardChoice {
  id: GameId;
  title: string;
  description: string;
  cardId?: GameId;
  passiveId?: GameId;
  upgradeId?: GameId;
  resourceChanges?: Partial<Record<MetricKey, number>>;
}

export interface Reward {
  id: GameId;
  type: RewardType;
  title: string;
  description: string;
  choices: RewardChoice[];
}

export type PassiveTrigger =
  | "runStart"
  | "scenarioStart"
  | "beforeCardPlay"
  | "afterCardPlay"
  | "scenarioEnd"
  | "finalReport";

export interface Passive {
  id: GameId;
  name: string;
  description: string;
  trigger: PassiveTrigger;
  effects: CardEffect[];
  complianceTopics: ComplianceTopic[];
}

export interface Upgrade {
  id: GameId;
  name: string;
  description: string;
  targetCardId: GameId;
  replacementCardId?: GameId;
  addedEffects?: CardEffect[];
  costChange?: CardCost;
}

export type LearningFeedbackTrigger =
  | "cardPlayed"
  | "conditionMet"
  | "scenarioResolved"
  | "rewardChosen"
  | "eventChosen"
  | "finalReport";

export interface LearningFeedback {
  id: GameId;
  message: string;
  trigger: LearningFeedbackTrigger;
  complianceTopics: ComplianceTopic[];
  relatedCardIds?: GameId[];
  relatedScenarioIds?: GameId[];
}

export type FinalReportOutcome = "completed" | "failed";
export type FinalReportGrade = "A" | "B" | "C" | "D";
export type FinalReportDecisionType = "card" | "event" | "reward" | "scenario";

export interface FinalReportKeyDecision {
  id: GameId;
  type: FinalReportDecisionType;
  label: string;
  detail: string;
}

export interface FinalReport {
  outcome: FinalReportOutcome;
  grade: FinalReportGrade;
  gradeLabel: string;
  score: number;
  headline: string;
  riskSummary: string;
  strongestBehavior: string;
  improvementArea: string;
  keyDecisions: FinalReportKeyDecision[];
  recommendedTopics: string[];
  takeaways: string[];
  metrics: Pick<PlayerResources, "risk" | "evidence" | "trust" | "pressure">;
  scenariosCompleted: number;
}

export interface DecisionLogEntry {
  id: GameId;
  type: DecisionType;
  nodeIndex: number;
  turnNumber?: number;
  scenarioId?: GameId;
  cardId?: GameId;
  rewardId?: GameId;
  eventId?: GameId;
  summary: string;
  resourceSnapshot: PlayerResources;
  resourceChanges?: Partial<Record<MetricKey, number>>;
  feedbackIds: GameId[];
}

export type DecisionLog = DecisionLogEntry[];
