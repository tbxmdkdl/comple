import type { LearningFeedback } from "../game";

export const learningFeedback: LearningFeedback[] = [
  {
    id: "feedback-clarify-before-deciding",
    message: "질문으로 사실관계를 확인하면 추측에 기대는 결정을 줄일 수 있습니다.",
    trigger: "cardPlayed",
    complianceTopics: ["generalCompliance"],
    relatedCardIds: ["clarifying-question", "risk-scan"],
  },
  {
    id: "feedback-policy-as-basis",
    message: "정책 확인은 단호한 대응을 뒷받침하는 근거가 됩니다.",
    trigger: "cardPlayed",
    complianceTopics: ["approvalProcess", "generalCompliance"],
    relatedCardIds: ["policy-check", "firm-refusal", "approval-request"],
  },
  {
    id: "feedback-document-for-traceability",
    message: "기록은 나중에 설명 가능한 선택을 만드는 데 도움이 됩니다.",
    trigger: "cardPlayed",
    complianceTopics: ["expensesAccounting", "generalCompliance"],
    relatedCardIds: ["fact-memo", "expense-trace", "preserve-evidence"],
  },
  {
    id: "feedback-safe-data-path",
    message: "민감 정보는 필요한 범위와 안전한 경로를 먼저 확인해야 합니다.",
    trigger: "cardPlayed",
    complianceTopics: ["dataPrivacy", "confidentialInformation"],
    relatedCardIds: ["safe-channel", "minimum-data", "privacy-flow-check"],
  },
  {
    id: "feedback-refuse-with-alternative",
    message: "거절은 대안을 함께 제시할 때 업무 흐름을 덜 흔들 수 있습니다.",
    trigger: "cardPlayed",
    complianceTopics: ["generalCompliance", "giftsHospitality"],
    relatedCardIds: ["firm-refusal", "alternative-path", "vendor-boundary"],
  },
  {
    id: "feedback-escalate-repeated-pressure",
    message: "반복되는 압박은 혼자 감당하기보다 적절한 채널에 상의하는 편이 안전합니다.",
    trigger: "cardPlayed",
    complianceTopics: ["retaliation", "generalCompliance"],
    relatedCardIds: ["compliance-consult", "speak-up", "retaliation-shield"],
  },
];
