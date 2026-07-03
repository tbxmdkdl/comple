import type { Scenario } from "../game";

export const scenarios: Scenario[] = [
  {
    id: "vendor-gift-pressure",
    title: "협력사의 고가 선물 제안",
    summary: "중요 계약을 앞두고 협력사가 고가 선물과 식사 자리를 제안합니다.",
    setup:
      "계약 일정은 빠듯하고 관계를 해치고 싶지 않습니다. 금액, 시점, 승인 여부가 분명하지 않습니다.",
    complianceTopics: ["giftsHospitality", "thirdPartyRisk", "approvalProcess"],
    pressureSignals: [
      {
        id: "vendor-value-timing",
        label: "계약 직전의 제안",
        description: "선물의 금액과 시점이 계약 판단에 영향을 줄 수 있습니다.",
        type: "businessPressure",
        severity: 2,
        visible: true,
      },
      {
        id: "approval-unclear",
        label: "승인 여부 불명확",
        description: "사전 승인이나 정책 기준이 확인되지 않았습니다.",
        type: "missingEvidence",
        severity: 2,
        visible: true,
      },
    ],
    intents: [
      {
        id: "vendor-presses-relationship",
        label: "관계 압박 증가",
        description: "거절이 늦어지면 관계와 일정 압박이 함께 커집니다.",
        pressureSignalIds: ["vendor-value-timing"],
        projectedChanges: [
          { resource: "pressure", amount: 2 },
          { resource: "risk", amount: 1 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 4, evidence: 0, trust: 5, pressure: 3 },
    successThresholds: [{ resource: "risk", operator: "atMost", value: 2 }],
    failureThresholds: [{ resource: "risk", operator: "atLeast", value: 9 }],
    turnLimit: 5,
    resolutionFeedbackIds: {
      success: "feedback-refuse-with-alternative",
      failure: "feedback-policy-as-basis",
    },
  },
  {
    id: "personal-data-personal-email",
    title: "개인정보를 개인 메일로 보내라는 요청",
    summary: "동료가 급한 고객 응대를 이유로 고객 목록을 개인 메일로 보내 달라고 합니다.",
    setup:
      "고객 응대 시간은 촉박하지만 전송 경로와 필요한 정보 범위가 확인되지 않았습니다.",
    complianceTopics: ["dataPrivacy", "confidentialInformation"],
    pressureSignals: [
      {
        id: "unsafe-transfer-channel",
        label: "안전하지 않은 전달 경로",
        description: "개인 메일은 민감 정보 전송 경로로 적절한지 확인이 필요합니다.",
        type: "dataExposure",
        severity: 3,
        visible: true,
      },
      {
        id: "minimum-data-unclear",
        label: "필요 범위 불명확",
        description: "전체 목록이 필요한지, 일부 정보만 필요한지 확인되지 않았습니다.",
        type: "missingEvidence",
        severity: 2,
        visible: true,
      },
    ],
    intents: [
      {
        id: "shortcut-data-transfer",
        label: "빠른 전송 압박",
        description: "빠른 처리는 가능하지만 정보 노출 리스크가 커질 수 있습니다.",
        pressureSignalIds: ["unsafe-transfer-channel"],
        projectedChanges: [
          { resource: "risk", amount: 2 },
          { resource: "pressure", amount: -1 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 5, evidence: 0, trust: 4, pressure: 4 },
    successThresholds: [{ resource: "risk", operator: "atMost", value: 2 }],
    failureThresholds: [{ resource: "risk", operator: "atLeast", value: 9 }],
    turnLimit: 5,
    resolutionFeedbackIds: {
      success: "feedback-safe-data-path",
      failure: "feedback-safe-data-path",
    },
  },
  {
    id: "expense-classification-pressure",
    title: "비용 처리 기준 우회 압박",
    summary: "분기 마감 직전 상사가 비용 항목을 다른 계정으로 처리하자고 합니다.",
    setup:
      "마감이 임박했고 상사의 요청이라 거절이 부담스럽습니다. 실제 목적과 승인 근거가 불명확합니다.",
    complianceTopics: ["expensesAccounting", "approvalProcess"],
    pressureSignals: [
      {
        id: "authority-deadline-pressure",
        label: "상급자와 마감 압박",
        description: "직급과 일정 압박이 판단을 서두르게 만듭니다.",
        type: "authorityPressure",
        severity: 3,
        visible: true,
      },
      {
        id: "expense-purpose-unclear",
        label: "비용 목적 불명확",
        description: "실제 목적과 처리 기준이 충분히 설명되지 않았습니다.",
        type: "missingEvidence",
        severity: 2,
        visible: true,
      },
    ],
    intents: [
      {
        id: "close-books-fast",
        label: "마감 우선 처리",
        description: "빨리 끝낼 수 있지만 나중에 설명이 어려워질 수 있습니다.",
        pressureSignalIds: ["authority-deadline-pressure", "expense-purpose-unclear"],
        projectedChanges: [
          { resource: "pressure", amount: -1 },
          { resource: "risk", amount: 2 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 5, evidence: 0, trust: 5, pressure: 5 },
    successThresholds: [
      { resource: "risk", operator: "atMost", value: 2 },
      { resource: "evidence", operator: "atLeast", value: 3 },
    ],
    failureThresholds: [{ resource: "risk", operator: "atLeast", value: 10 }],
    turnLimit: 6,
    resolutionFeedbackIds: {
      success: "feedback-document-for-traceability",
      failure: "feedback-policy-as-basis",
    },
  },
  {
    id: "family-vendor-conflict",
    title: "친인척 업체 추천",
    summary: "외주사 선정 과정에서 친인척 회사가 후보에 포함되어 있습니다.",
    setup:
      "성과를 내야 하고 개인 관계도 얽혀 있습니다. 이해관계 공개 여부와 평가 공정성이 분명하지 않습니다.",
    complianceTopics: ["conflictOfInterest", "thirdPartyRisk"],
    pressureSignals: [
      {
        id: "conflict-interest-signal",
        label: "이해관계 가능성",
        description: "개인 관계가 평가의 공정성에 영향을 줄 수 있습니다.",
        type: "conflictSignal",
        severity: 3,
        visible: true,
      },
      {
        id: "selection-performance-pressure",
        label: "성과 압박",
        description: "빠른 선정이 필요해 공개와 검토를 미루고 싶은 유인이 있습니다.",
        type: "businessPressure",
        severity: 2,
        visible: true,
      },
    ],
    intents: [
      {
        id: "quiet-selection",
        label: "조용히 진행하려는 흐름",
        description: "관계를 언급하지 않으면 빠르지만 나중에 신뢰가 손상될 수 있습니다.",
        pressureSignalIds: ["conflict-interest-signal"],
        projectedChanges: [
          { resource: "risk", amount: 2 },
          { resource: "trust", amount: -1 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 4, evidence: 0, trust: 5, pressure: 4 },
    successThresholds: [
      { resource: "risk", operator: "atMost", value: 2 },
      { resource: "trust", operator: "atLeast", value: 3 },
    ],
    failureThresholds: [{ resource: "trust", operator: "atMost", value: 0 }],
    turnLimit: 5,
    resolutionFeedbackIds: {
      success: "feedback-document-for-traceability",
      failure: "feedback-clarify-before-deciding",
    },
  },
  {
    id: "retaliation-concern-after-report",
    title: "문제 제기 후 보복 우려",
    summary: "동료가 부적절한 지시를 제보한 뒤 회의와 정보 공유에서 배제되는 분위기가 생겼습니다.",
    setup:
      "분위기를 더 악화시키고 싶지 않지만 보복 여부, 기록, 지원 채널이 분명하지 않습니다.",
    complianceTopics: ["retaliation", "generalCompliance"],
    pressureSignals: [
      {
        id: "retaliation-concern-signal",
        label: "보복 우려",
        description: "문제 제기 이후 불이익처럼 보이는 변화가 있습니다.",
        type: "retaliationConcern",
        severity: 3,
        visible: true,
      },
      {
        id: "record-gap",
        label: "기록 부족",
        description: "무슨 일이 언제 있었는지 설명할 기록이 부족합니다.",
        type: "missingEvidence",
        severity: 2,
        visible: true,
      },
    ],
    intents: [
      {
        id: "silence-to-avoid-tension",
        label: "침묵 유도",
        description: "갈등을 피하면 당장은 조용하지만 우려가 반복될 수 있습니다.",
        pressureSignalIds: ["retaliation-concern-signal"],
        projectedChanges: [
          { resource: "pressure", amount: 1 },
          { resource: "risk", amount: 2 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 5, evidence: 0, trust: 3, pressure: 5 },
    successThresholds: [
      { resource: "risk", operator: "atMost", value: 2 },
      { resource: "evidence", operator: "atLeast", value: 2 },
    ],
    failureThresholds: [{ resource: "pressure", operator: "atLeast", value: 10 }],
    turnLimit: 6,
    resolutionFeedbackIds: {
      success: "feedback-escalate-repeated-pressure",
      failure: "feedback-document-for-traceability",
    },
  },
  {
    id: "informal-sales-side-letter",
    title: "매출 목표를 위한 우회 제안",
    summary: "고객이 계약 조건 일부를 비공식 문서로 처리하자고 제안합니다.",
    setup:
      "매출 목표와 고객 관계가 걸려 있지만 공식 계약과 다른 조건이 기록 밖에 남을 수 있습니다.",
    complianceTopics: ["approvalProcess", "expensesAccounting", "generalCompliance"],
    pressureSignals: [
      {
        id: "side-letter-signal",
        label: "비공식 조건 제안",
        description: "공식 계약과 다른 합의가 별도로 생길 수 있습니다.",
        type: "businessPressure",
        severity: 3,
        visible: true,
      },
      {
        id: "missing-contract-record",
        label: "기록 밖 합의",
        description: "나중에 설명할 공식 기록이 부족할 수 있습니다.",
        type: "missingEvidence",
        severity: 3,
        visible: true,
      },
    ],
    intents: [
      {
        id: "close-deal-fast",
        label: "빠른 계약 마감",
        description: "목표 달성은 가까워지지만 설명 가능성이 떨어질 수 있습니다.",
        pressureSignalIds: ["side-letter-signal", "missing-contract-record"],
        projectedChanges: [
          { resource: "risk", amount: 3 },
          { resource: "pressure", amount: -1 },
        ],
        visible: true,
      },
    ],
    startingResources: { risk: 6, evidence: 0, trust: 4, pressure: 6 },
    successThresholds: [
      { resource: "risk", operator: "atMost", value: 2 },
      { resource: "evidence", operator: "atLeast", value: 3 },
    ],
    failureThresholds: [{ resource: "risk", operator: "atLeast", value: 10 }],
    turnLimit: 6,
    isFinal: true,
    resolutionFeedbackIds: {
      success: "feedback-policy-as-basis",
      failure: "feedback-document-for-traceability",
    },
  },
];
