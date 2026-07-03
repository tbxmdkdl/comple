import type { Card } from "../game";

export const cards: Card[] = [
  {
    id: "risk-scan",
    name: "리스크 훑어보기",
    description: "숨은 위험 신호를 확인합니다. 즉시 해결되지는 않지만 다음 판단이 선명해집니다.",
    category: "observe",
    tags: ["observe", "earlyAction", "riskReduction"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-clarify-before-deciding",
    effects: [
      {
        type: "addScenarioSignal",
        signalId: "early-risk-signal",
        intensity: 1,
      },
      {
        type: "adjustResource",
        changes: [
          { resource: "risk", amount: -1, reason: "초기 신호를 확인함" },
          { resource: "pressure", amount: 1, reason: "확인 시간이 추가됨" },
        ],
      },
    ],
  },
  {
    id: "clarifying-question",
    name: "명확한 질문",
    description: "불명확한 요청을 구체화합니다. 압박은 남지만 추측으로 움직일 가능성을 낮춥니다.",
    category: "ask",
    tags: ["ask", "earlyAction", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-clarify-before-deciding",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 1, reason: "사실관계 확인" },
          { resource: "pressure", amount: -1, reason: "불확실성 감소" },
        ],
      },
    ],
  },
  {
    id: "policy-check",
    name: "정책 확인",
    description: "기준을 확인합니다. 즉시 해결보다 이후 승인 요청이나 거절을 뒷받침합니다.",
    category: "checkPolicy",
    tags: ["checkPolicy", "policyKnowledge", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["approvalProcess", "generalCompliance"],
    learningFeedbackId: "feedback-policy-as-basis",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 1, reason: "정책 근거 확보" },
          { resource: "pressure", amount: 1, reason: "확인 시간이 필요함" },
        ],
      },
      {
        type: "addScenarioSignal",
        signalId: "policy-basis",
        intensity: 1,
      },
    ],
  },
  {
    id: "fact-memo",
    name: "사실 메모",
    description: "요청과 맥락을 기록합니다. 증거는 늘지만 상대가 부담을 느낄 수 있습니다.",
    category: "document",
    tags: ["document", "evidenceBased", "trustCost"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-document-for-traceability",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 2, reason: "기록 확보" },
          { resource: "trust", amount: -1, reason: "기록에 대한 부담" },
        ],
      },
    ],
  },
  {
    id: "safe-channel",
    name: "안전 채널 제안",
    description: "개인정보나 기밀정보를 안전한 전달 경로로 옮기도록 제안합니다.",
    category: "protectData",
    tags: ["protectData", "riskReduction", "pressureControl"],
    cost: { attention: 1 },
    complianceTopics: ["dataPrivacy", "confidentialInformation"],
    learningFeedbackId: "feedback-safe-data-path",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "risk", amount: -2, reason: "노출 경로 축소" },
          { resource: "pressure", amount: 1, reason: "처리 경로 변경" },
        ],
      },
    ],
  },
  {
    id: "minimum-data",
    name: "최소 정보 원칙",
    description: "필요한 정보만 다루도록 범위를 줄입니다. 증거가 있으면 더 안정적입니다.",
    category: "protectData",
    tags: ["protectData", "riskReduction", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["dataPrivacy"],
    learningFeedbackId: "feedback-safe-data-path",
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "evidence",
          operator: "atLeast",
          value: 1,
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -2, reason: "필요 범위 확인" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -1, reason: "정보 범위 축소" },
              { resource: "pressure", amount: 1, reason: "추가 확인 필요" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "approval-request",
    name: "사전 승인 요청",
    description: "근거를 갖춰 승인 루트를 탑니다. 준비가 부족하면 일정 압박이 커질 수 있습니다.",
    category: "consult",
    tags: ["consult", "policyKnowledge", "evidenceBased"],
    cost: { attention: 2 },
    complianceTopics: ["approvalProcess"],
    learningFeedbackId: "feedback-policy-as-basis",
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "evidence",
          operator: "atLeast",
          value: 2,
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -3, reason: "승인 근거 확보" },
              { resource: "trust", amount: 1, reason: "절차적 신뢰 확보" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -1, reason: "승인 루트 착수" },
              { resource: "pressure", amount: 2, reason: "준비 부족" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "manager-consult",
    name: "상사와 상의",
    description: "상황을 공유해 압박을 나눕니다. 이해상충이나 회계 상황에서는 근거 보강에 유리합니다.",
    category: "consult",
    tags: ["consult", "pressureControl", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["conflictOfInterest", "expensesAccounting", "generalCompliance"],
    learningFeedbackId: "feedback-escalate-repeated-pressure",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "pressure", amount: -2, reason: "혼자 판단하지 않음" },
          { resource: "evidence", amount: 1, reason: "상의 기록 확보" },
        ],
      },
    ],
  },
  {
    id: "compliance-consult",
    name: "컴플라이언스 상담",
    description: "고위험 상황을 적절한 채널에 상의합니다. 증거가 있으면 더 강하지만 신뢰 비용이 생길 수 있습니다.",
    category: "escalate",
    tags: ["escalate", "evidenceBased", "trustCost", "riskReduction"],
    cost: { attention: 2 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-escalate-repeated-pressure",
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "evidence",
          operator: "atLeast",
          value: 2,
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -4, reason: "근거 있는 상담" },
              { resource: "trust", amount: -1, reason: "공식 채널 사용" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -2, reason: "상담 착수" },
              { resource: "trust", amount: -2, reason: "근거 부족으로 부담 증가" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "firm-refusal",
    name: "근거 기반 거절",
    description: "명확한 위험을 단호히 멈춥니다. 정책 근거가 없으면 관계 비용이 커질 수 있습니다.",
    category: "refuse",
    tags: ["refuse", "riskReduction", "trustCost"],
    cost: { attention: 2 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-refuse-with-alternative",
    effects: [
      {
        type: "conditional",
        condition: {
          type: "cardTag",
          tag: "policyKnowledge",
          operator: "has",
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -4, reason: "정책 근거를 둔 거절" },
              { resource: "trust", amount: -1, reason: "단호한 대응" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -3, reason: "위험 행동 중단" },
              { resource: "trust", amount: -2, reason: "근거 설명 부족" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "alternative-path",
    name: "안전한 대안 제시",
    description: "거절 뒤 업무가 이어질 수 있는 대안을 제시합니다. 단독 사용 시 리스크 해결은 약합니다.",
    category: "repairTrust",
    tags: ["repairTrust", "pressureControl"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-refuse-with-alternative",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "trust", amount: 2, reason: "대안 제시" },
          { resource: "pressure", amount: -1, reason: "업무 흐름 유지" },
          { resource: "risk", amount: -1, reason: "안전한 방향 전환" },
        ],
      },
    ],
  },
  {
    id: "preserve-evidence",
    name: "증거 보존",
    description: "장기 검토에 필요한 근거를 지킵니다. 당장은 압박이 조금 커질 수 있습니다.",
    category: "preserveEvidence",
    tags: ["preserveEvidence", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-document-for-traceability",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 3, reason: "근거 보존" },
          { resource: "pressure", amount: 1, reason: "즉시 처리 지연" },
        ],
      },
    ],
  },
  {
    id: "audit-ready",
    name: "감사 대비 정리",
    description: "증거가 충분할 때 리스크와 압박을 함께 낮춥니다. 준비 전에는 효과가 제한됩니다.",
    category: "prepareAudit",
    tags: ["prepareAudit", "evidenceBased", "riskReduction"],
    cost: { attention: 2 },
    complianceTopics: ["generalCompliance", "expensesAccounting"],
    learningFeedbackId: "feedback-document-for-traceability",
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "evidence",
          operator: "atLeast",
          value: 3,
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -3, reason: "검토 대비 완료" },
              { resource: "pressure", amount: -2, reason: "설명 가능성 확보" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "evidence", amount: 1, reason: "정리 시작" },
              { resource: "pressure", amount: 1, reason: "자료 부족" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "cool-down",
    name: "잠시 멈추기",
    description: "압박을 낮추고 성급한 결정을 피합니다. 이번 턴의 행동 여지는 줄어듭니다.",
    category: "manageConflict",
    tags: ["manageConflict", "pressureControl"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    learningFeedbackId: "feedback-clarify-before-deciding",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "pressure", amount: -3, reason: "즉시 반응을 늦춤" },
          { resource: "attention", amount: -1, reason: "시간을 들여 멈춤" },
        ],
      },
    ],
  },
  {
    id: "stakeholder-align",
    name: "이해관계자 정렬",
    description: "신뢰를 회복하고 기대치를 맞춥니다. 리스크 처리는 잠시 늦어질 수 있습니다.",
    category: "repairTrust",
    tags: ["repairTrust", "pressureControl"],
    cost: { attention: 1 },
    complianceTopics: ["generalCompliance"],
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "trust", amount: 2, reason: "기대치 조정" },
          { resource: "pressure", amount: -1, reason: "관계 압박 완화" },
          { resource: "risk", amount: 1, reason: "해결 지연" },
        ],
      },
    ],
  },
  {
    id: "conflict-disclosure",
    name: "이해상충 공개",
    description: "관련성을 일찍 알립니다. 관련 없는 상황에서는 과한 대응처럼 보일 수 있습니다.",
    category: "manageConflict",
    tags: ["manageConflict", "evidenceBased", "trustCost"],
    cost: { attention: 1 },
    complianceTopics: ["conflictOfInterest"],
    effects: [
      {
        type: "conditional",
        condition: {
          type: "scenarioSignal",
          signalId: "conflict-interest-signal",
          operator: "present",
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "risk", amount: -3, reason: "이해상충 공개" },
              { resource: "trust", amount: 1, reason: "투명성 확보" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "evidence", amount: 1, reason: "관련성 확인" },
              { resource: "pressure", amount: 1, reason: "불필요한 복잡성" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "retaliation-shield",
    name: "보복 방지 확인",
    description: "문제 제기 이후의 안전을 확인합니다. 심리적 부담은 남을 수 있습니다.",
    category: "escalate",
    tags: ["escalate", "pressureControl", "riskReduction"],
    cost: { attention: 1 },
    complianceTopics: ["retaliation"],
    learningFeedbackId: "feedback-escalate-repeated-pressure",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "pressure", amount: -2, reason: "보복 우려 관리" },
          { resource: "risk", amount: -1, reason: "안전 채널 확인" },
          { resource: "evidence", amount: 1, reason: "우려 사항 기록" },
        ],
      },
    ],
  },
  {
    id: "privacy-flow-check",
    name: "개인정보 흐름 확인",
    description: "데이터가 어디로 이동하는지 확인합니다. 숨은 노출 위험을 드러내는 탐색 카드입니다.",
    category: "protectData",
    tags: ["protectData", "earlyAction", "evidenceBased"],
    cost: { attention: 1 },
    complianceTopics: ["dataPrivacy"],
    learningFeedbackId: "feedback-safe-data-path",
    effects: [
      {
        type: "addScenarioSignal",
        signalId: "data-flow-risk",
        intensity: 1,
      },
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 1, reason: "데이터 흐름 확인" },
          { resource: "risk", amount: -1, reason: "노출 지점 파악" },
        ],
      },
    ],
  },
  {
    id: "expense-trace",
    name: "비용 근거 확인",
    description: "비용 처리의 목적과 근거를 확인합니다. 회계 상황에서 특히 강합니다.",
    category: "document",
    tags: ["document", "evidenceBased", "policyKnowledge"],
    cost: { attention: 1 },
    complianceTopics: ["expensesAccounting"],
    learningFeedbackId: "feedback-document-for-traceability",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "evidence", amount: 2, reason: "비용 근거 확보" },
          { resource: "risk", amount: -1, reason: "처리 기준 확인" },
        ],
      },
    ],
  },
  {
    id: "vendor-boundary",
    name: "협력사 경계 설정",
    description: "선물, 접대, 편의 제공의 선을 긋습니다. 정책 확인과 함께 쓰면 부담이 줄어듭니다.",
    category: "refuse",
    tags: ["refuse", "riskReduction", "trustCost"],
    cost: { attention: 1 },
    complianceTopics: ["giftsHospitality", "thirdPartyRisk"],
    learningFeedbackId: "feedback-refuse-with-alternative",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "risk", amount: -2, reason: "협력사 경계 설정" },
          { resource: "trust", amount: -1, reason: "관계 부담" },
        ],
      },
    ],
  },
  {
    id: "speak-up",
    name: "문제 제기",
    description: "반복 압박이나 침묵 강요를 적절한 채널에 알립니다. 증거 보존과 함께 쓰면 안정적입니다.",
    category: "escalate",
    tags: ["escalate", "riskReduction", "pressureControl"],
    cost: { attention: 2 },
    complianceTopics: ["retaliation", "generalCompliance"],
    learningFeedbackId: "feedback-escalate-repeated-pressure",
    effects: [
      {
        type: "adjustResource",
        changes: [
          { resource: "risk", amount: -3, reason: "반복 압박 공유" },
          { resource: "pressure", amount: -2, reason: "공식 채널 사용" },
          { resource: "trust", amount: -1, reason: "관계 긴장" },
        ],
      },
    ],
  },
  {
    id: "clean-exit",
    name: "깔끔한 종료",
    description: "리스크가 낮고 증거가 충분할 때 상황을 안전하게 마무리합니다. 준비 부족이면 압박이 남습니다.",
    category: "prepareAudit",
    tags: ["prepareAudit", "evidenceBased", "riskReduction"],
    cost: { attention: 2 },
    complianceTopics: ["generalCompliance"],
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "risk",
          operator: "atMost",
          value: 2,
        },
        whenMet: [
          {
            type: "scenarioProgress",
            target: "success",
            amount: 2,
          },
          {
            type: "adjustResource",
            changes: [
              { resource: "pressure", amount: -1, reason: "안전한 마무리" },
            ],
          },
        ],
        whenNotMet: [
          {
            type: "adjustResource",
            changes: [
              { resource: "pressure", amount: 2, reason: "준비 부족한 종료 시도" },
            ],
          },
        ],
      },
    ],
  },
];
