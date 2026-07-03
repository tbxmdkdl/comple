import type { FixedRunPhase, FixedRunProgress } from "../game";

type RunProgressProps = {
  phase: FixedRunPhase;
  progress: FixedRunProgress;
};

const phaseLabels: Record<FixedRunPhase, string> = {
  intro: "런 시작 전",
  event: "이벤트 선택",
  scenario: "상황 진행 중",
  reward: "다음 조치 카드 선택",
  complete: "런 완료",
  failed: "런 중단",
};

export function RunProgress({ phase, progress }: RunProgressProps) {
  return (
    <section className="run-progress" aria-label="런 진행 상태">
      <div>
        <p className="eyebrow">현재 단계</p>
        <strong>{progress.isFinal ? "최종 상황" : progress.label}</strong>
      </div>
      <ol className="run-track" aria-label="런 진행 순서">
        {progress.steps.map((step, index) => {
          const isCurrent = index === progress.currentIndex;
          const isComplete = index < progress.currentIndex;

          return (
            <li
              className={[
                "run-step",
                isCurrent ? "current" : "",
                isComplete ? "complete" : "",
              ].join(" ")}
              key={step.id}
            >
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
            </li>
          );
        })}
      </ol>
      <div className="run-phase-chip">
        {phase === "scenario" && progress.isFinal
          ? "최종 상황 진행 중"
          : phaseLabels[phase]}
      </div>
    </section>
  );
}
