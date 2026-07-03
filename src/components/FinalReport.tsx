import type { FinalReport as FinalReportData } from "../game";

type FinalReportProps = {
  report: FinalReportData;
  onReplay: () => void;
};

const outcomeLabels: Record<FinalReportData["outcome"], string> = {
  completed: "런 완료",
  failed: "런 중단",
};

export function FinalReport({ onReplay, report }: FinalReportProps) {
  return (
    <section className="final-report" aria-label="최종 리포트">
      <div className="report-hero">
        <div>
          <p className="eyebrow">최종 리포트</p>
          <h2>{report.headline}</h2>
          <p>{report.riskSummary}</p>
        </div>
        <div className="grade-card" aria-label="런 결과 등급">
          <span>{outcomeLabels[report.outcome]}</span>
          <strong>{report.grade}</strong>
          <span>{report.gradeLabel}</span>
          <small>{report.score}점</small>
        </div>
      </div>

      <div className="report-metric-grid" aria-label="최종 지표">
        <MetricItem label="리스크" value={report.metrics.risk} />
        <MetricItem label="증빙" value={report.metrics.evidence} />
        <MetricItem label="신뢰" value={report.metrics.trust} />
        <MetricItem label="압박" value={report.metrics.pressure} />
        <MetricItem label="해결한 상황" value={report.scenariosCompleted} />
      </div>

      <div className="report-grid">
        <section className="report-section">
          <h3>판단 스타일</h3>
          <dl className="behavior-list">
            <div>
              <dt>강점</dt>
              <dd>{report.strongestBehavior}</dd>
            </div>
            <div>
              <dt>보완할 점</dt>
              <dd>{report.improvementArea}</dd>
            </div>
          </dl>
        </section>

        <section className="report-section">
          <h3>추천 학습 주제</h3>
          <ul className="topic-list">
            {report.recommendedTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>

        <section className="report-section wide">
          <h3>주요 결정</h3>
          <ol className="decision-list">
            {report.keyDecisions.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.label}</strong>
                <span>{decision.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="report-section wide">
          <h3>실무 takeaway</h3>
          <ul className="takeaway-list">
            {report.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="report-actions">
        <button className="primary-button" onClick={onReplay} type="button">
          런 다시 시작
        </button>
      </div>
    </section>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <article className="report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
