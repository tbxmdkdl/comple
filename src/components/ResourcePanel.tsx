import type { MetricKey, PlayerResources, TurnResourceKey } from "../game";

type ResourcePanelProps = {
  resources: PlayerResources;
  turnResource: TurnResourceKey;
  maxAttention: number;
  maxTime?: number;
};

type MetricView = {
  key: MetricKey;
  label: string;
  tone: string;
  helper: string;
};

const baseMetrics: MetricView[] = [
  {
    key: "risk",
    label: "리스크",
    tone: "risk",
    helper: "높을수록 실패에 가까워집니다.",
  },
  {
    key: "evidence",
    label: "증빙",
    tone: "evidence",
    helper: "기록과 근거가 정리된 정도입니다.",
  },
  {
    key: "trust",
    label: "신뢰",
    tone: "trust",
    helper: "관계와 설명 가능성을 나타냅니다.",
  },
  {
    key: "pressure",
    label: "압박",
    tone: "pressure",
    helper: "시간, 관계, 성과 압박입니다.",
  },
];

export function ResourcePanel({
  maxAttention,
  maxTime,
  resources,
  turnResource,
}: ResourcePanelProps) {
  const turnMetric: MetricView = {
    key: turnResource,
    label: turnResource === "attention" ? "주의력" : "시간",
    tone: "attention",
    helper: "이번 턴에 쓸 수 있는 행동 여유입니다.",
  };
  const metrics = [...baseMetrics, turnMetric];
  const maxTurnResource =
    turnResource === "attention" ? maxAttention : maxTime ?? resources.time ?? 0;

  return (
    <section className="resource-panel" aria-label="현재 지표">
      {metrics.map((metric) => {
        const value = resources[metric.key] ?? 0;
        const valueText =
          metric.key === turnResource ? `${value}/${maxTurnResource}` : value;

        return (
          <article className={`resource-chip ${metric.tone}`} key={metric.key}>
            <span className="resource-head">
              <span className="resource-label">{metric.label}</span>
              <strong className="resource-value">{valueText}</strong>
            </span>
            <span className="resource-helper">{metric.helper}</span>
          </article>
        );
      })}
    </section>
  );
}
