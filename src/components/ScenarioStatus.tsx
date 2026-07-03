import type { Scenario, ScenarioOutcome, ScenarioPressureSignal } from "../game";

type ScenarioStatusProps = {
  activeSignalIds: string[];
  outcome: ScenarioOutcome;
  scenario: Scenario;
  turnNumber: number;
};

export function ScenarioStatus({
  activeSignalIds,
  outcome,
  scenario,
  turnNumber,
}: ScenarioStatusProps) {
  const visibleSignals = scenario.pressureSignals.filter(
    (signal) => signal.visible && activeSignalIds.includes(signal.id),
  );
  const visibleIntents = scenario.intents?.filter((intent) => intent.visible) ?? [];

  return (
    <section className="scenario-status" aria-label="상황 신호">
      <div className={`outcome-banner ${outcome}`}>
        <span>현재 상태</span>
        <strong>{formatOutcome(outcome)}</strong>
        <span>
          {scenario.turnLimit
            ? `${turnNumber}턴 / 권장 ${scenario.turnLimit}턴`
            : `${turnNumber}턴 진행 중`}
        </span>
      </div>

      <div className="signal-grid">
        <div className="signal-column">
          <h2>위험 신호</h2>
          {visibleSignals.length > 0 ? (
            visibleSignals.map((signal) => (
              <SignalItem key={signal.id} signal={signal} />
            ))
          ) : (
            <p className="empty-copy">현재 드러난 추가 신호가 없습니다.</p>
          )}
        </div>

        <div className="signal-column">
          <h2>압박 예고</h2>
          {visibleIntents.length > 0 ? (
            visibleIntents.map((intent) => (
              <article className="signal-item" key={intent.id}>
                <strong>{formatUiText(intent.label)}</strong>
                <p>{formatUiText(intent.description)}</p>
              </article>
            ))
          ) : (
            <p className="empty-copy">이번 상황의 추가 압박 예고가 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SignalItem({ signal }: { signal: ScenarioPressureSignal }) {
  return (
    <article className="signal-item">
      <strong>{formatUiText(signal.label)}</strong>
      <p>{formatUiText(signal.description)}</p>
      <span>심각도 {signal.severity}</span>
    </article>
  );
}

function formatOutcome(outcome: ScenarioOutcome): string {
  if (outcome === "success") {
    return "상황 해결";
  }

  if (outcome === "failure") {
    return "리스크 확대";
  }

  return "판단 진행 중";
}

function formatUiText(text: string): string {
  return text.replaceAll("증거", "증빙");
}
