import type { Card, CardCategory, CardTag, MetricKey } from "../game";

type ActionCardProps = {
  card: Card;
  disabled: boolean;
  disabledReason?: string;
  onPlay: () => void;
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

export function ActionCard({
  card,
  disabled,
  disabledReason,
  onPlay,
}: ActionCardProps) {
  const tags = card.tags.slice(0, 3).map((tag) => getTagLabel(tag));

  return (
    <button
      className={`action-card ${disabled ? "is-disabled" : "is-playable"}`}
      disabled={disabled}
      onClick={onPlay}
      type="button"
    >
      <span className="card-kind">조치 카드</span>
      <span className="card-meta-row">
        <span className="card-cost">{formatCost(card.cost)}</span>
        <span className="card-category">{categoryLabels[card.category]}</span>
      </span>
      <strong className="card-title">{formatUiText(card.name)}</strong>
      <span className="card-effect">{formatUiText(card.description)}</span>
      <span className="card-tags">{formatUiText(tags.join(" · "))}</span>
      {disabledReason ? (
        <span className="card-status-line card-disabled-reason">
          {disabledReason}
        </span>
      ) : (
        <span className="card-status-line card-play-hint">실행 가능</span>
      )}
    </button>
  );
}

function formatCost(cost: Card["cost"]): string {
  const entries = Object.entries(cost).filter(([, amount]) => (amount ?? 0) > 0);

  if (entries.length === 0) {
    return "비용 0";
  }

  return entries
    .map(([resource, amount]) => `${metricLabels[resource as MetricKey]} ${amount}`)
    .join(" / ");
}

function getTagLabel(tag: CardTag): string {
  return tagLabels[tag] ?? categoryLabels[tag as CardCategory] ?? tag;
}

function formatUiText(text: string): string {
  return text
    .replaceAll("증거가", "증빙이")
    .replaceAll("증거는", "증빙은")
    .replaceAll("증거를", "증빙을")
    .replaceAll("증거", "증빙");
}
