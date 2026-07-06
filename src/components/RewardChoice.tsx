import type { Card, CardCategory, CardTag, GameId, MetricKey } from "../game";

type RewardChoiceProps = {
  deckSize: number;
  options: Card[];
  selectedCardId?: GameId;
  onContinue: () => void;
  onSelect: (card: Card) => void;
};

const categoryLabels: Record<CardCategory, string> = {
  observe: "관찰",
  ask: "질문",
  checkPolicy: "정책 확인",
  document: "기록",
  consult: "상의",
  escalate: "에스컬레이션",
  refuse: "거절",
  protectData: "정보 보호",
  manageConflict: "갈등 관리",
  preserveEvidence: "증빙 보존",
  repairTrust: "신뢰 회복",
  prepareAudit: "검토 대비",
};

const tagLabels: Partial<Record<CardTag, string>> = {
  earlyAction: "초기 대응",
  evidenceBased: "근거 기반",
  policyKnowledge: "정책 근거",
  pressureControl: "압박 관리",
  riskReduction: "리스크 감소",
  trustCost: "신뢰 비용",
};

const metricLabels: Record<MetricKey, string> = {
  risk: "리스크",
  evidence: "증빙",
  trust: "신뢰",
  pressure: "압박",
  attention: "주의력",
  time: "시간",
};

export function RewardChoice({
  deckSize,
  onContinue,
  onSelect,
  options,
  selectedCardId,
}: RewardChoiceProps) {
  const selectedCard = options.find((card) => card.id === selectedCardId);

  return (
    <section className="reward-panel" aria-label="카드 보상 선택">
      <div className="reward-heading">
        <div>
          <p className="eyebrow">상황 해결 보상</p>
          <h2>새 조치 카드 선택</h2>
          <p>
            이번 선택은 런 덱에 유지됩니다. 다음 상황은 업데이트된 덱으로
            시작합니다.
          </p>
        </div>
        <strong className="deck-size-chip">현재 덱 {deckSize}장</strong>
      </div>

      <div className="reward-options" aria-label="보상 카드 후보">
        {options.map((card) => {
          const isSelected = selectedCardId === card.id;

          return (
            <button
              className={`reward-card ${isSelected ? "selected" : ""}`}
              disabled={Boolean(selectedCardId)}
              key={card.id}
              onClick={() => onSelect(card)}
              type="button"
            >
              <span className="card-kind">덱에 추가할 조치</span>
              <span className="card-meta-row">
                <span className="card-cost">{formatCost(card)}</span>
                <span className="card-category">{categoryLabels[card.category]}</span>
              </span>
              <strong className="card-title">{formatUiText(card.name)}</strong>
              <span className="card-effect">{formatUiText(card.description)}</span>
              <span className="card-tags">{formatUiText(formatTags(card))}</span>
              <span className="reward-select-label">
                {isSelected ? "선택 완료" : "덱에 추가"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="reward-footer">
        {selectedCard ? (
          <p className="reward-confirmation">
            {formatUiText(selectedCard.name)} 카드가 덱에 추가되었습니다.
          </p>
        ) : (
          <p className="empty-copy">세 가지 조치 중 하나를 선택하세요.</p>
        )}
        <button
          className="primary-button"
          disabled={!selectedCard}
          onClick={onContinue}
          type="button"
        >
          다음 상황으로 진행
        </button>
      </div>
    </section>
  );
}

function formatCost(card: Card): string {
  const entries = Object.entries(card.cost).filter(([, amount]) => (amount ?? 0) > 0);

  if (entries.length === 0) {
    return "비용 0";
  }

  return entries
    .map(([resource, amount]) => `${metricLabels[resource as MetricKey]} ${amount}`)
    .join(" / ");
}

function formatTags(card: Card): string {
  return card.tags
    .slice(0, 3)
    .map((tag) => tagLabels[tag] ?? categoryLabels[tag as CardCategory] ?? tag)
    .join(" · ");
}

function formatUiText(text: string): string {
  return text
    .replaceAll("증거가", "증빙이")
    .replaceAll("증거는", "증빙은")
    .replaceAll("증거를", "증빙을")
    .replaceAll("증거", "증빙");
}
