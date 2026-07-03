import type { Event } from "../game";

export const events: Event[] = [
  {
    id: "lunch-briefing",
    title: "짧은 점심 브리핑",
    description:
      "점심시간에 짧은 컴플라이언스 팁을 들을 기회가 있습니다. 시간을 조금 쓰면 다음 판단 기준이 선명해질 수 있습니다.",
    complianceTopics: ["generalCompliance", "approvalProcess"],
    choices: [
      {
        id: "listen-for-policy-cue",
        label: "10분 듣기",
        consequence:
          "정책 확인 기준이 조금 선명해졌습니다. 대신 일정 압박은 약간 남습니다.",
        effects: [
          {
            type: "adjustResource",
            changes: [
              { resource: "evidence", amount: 1, reason: "짧은 기준 확인" },
              { resource: "pressure", amount: 1, reason: "시간 사용" },
            ],
          },
        ],
      },
      {
        id: "skip-briefing",
        label: "그냥 지나가기",
        consequence:
          "일정 여유는 조금 생겼지만, 추가 기준 없이 다음 상황으로 넘어갑니다.",
        effects: [
          {
            type: "adjustResource",
            changes: [
              { resource: "pressure", amount: -1, reason: "시간 절약" },
              { resource: "risk", amount: 1, reason: "추가 기준 미확인" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "organize-notes",
    title: "자료 정리 시간",
    description:
      "지난 요청과 대화를 정리할 시간이 생겼습니다. 꼼꼼히 정리할 수도 있고, 다음 흐름을 위해 덱을 가볍게 보강할 수도 있습니다.",
    complianceTopics: ["generalCompliance", "expensesAccounting"],
    choices: [
      {
        id: "write-clear-notes",
        label: "요청 내용 정리",
        consequence:
          "나중에 설명할 증빙이 늘었습니다. 다만 정리 시간이 들어 압박이 조금 커집니다.",
        effects: [
          {
            type: "adjustResource",
            changes: [
              { resource: "evidence", amount: 2, reason: "요청 정리" },
              { resource: "pressure", amount: 1, reason: "정리 시간 사용" },
            ],
          },
        ],
      },
      {
        id: "prepare-note-template",
        label: "메모 틀만 만들기",
        consequence:
          "깊은 검토는 미뤘지만, 이후 기록을 남기기 쉬운 조치 카드가 덱에 보강됩니다.",
        effects: [
          {
            type: "addCardToDeck",
            cardId: "fact-memo",
          },
          {
            type: "adjustResource",
            changes: [
              { resource: "pressure", amount: -1, reason: "빠른 준비" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "deadline-choice",
    title: "마감 전 선택",
    description:
      "마감이 임박했습니다. 한 번 더 확인해 장기 리스크를 줄일지, 지금 압박을 낮추는 방향으로 정리할지 선택해야 합니다.",
    complianceTopics: ["approvalProcess", "generalCompliance"],
    choices: [
      {
        id: "check-once-more",
        label: "한 번 더 확인",
        consequence:
          "압박은 늘었지만 다음 판단에 쓸 정책 확인 카드가 덱에 보강됩니다.",
        effects: [
          {
            type: "adjustResource",
            changes: [
              { resource: "evidence", amount: 1, reason: "추가 확인" },
              { resource: "pressure", amount: 2, reason: "마감 전 확인" },
            ],
          },
          {
            type: "addCardToDeck",
            cardId: "policy-check",
          },
        ],
      },
      {
        id: "close-fast",
        label: "빠르게 정리",
        consequence:
          "당장의 압박은 낮아졌지만, 확인하지 못한 리스크가 조금 남습니다.",
        effects: [
          {
            type: "adjustResource",
            changes: [
              { resource: "pressure", amount: -2, reason: "빠른 정리" },
              { resource: "risk", amount: 1, reason: "추가 확인 생략" },
            ],
          },
        ],
      },
    ],
  },
];
