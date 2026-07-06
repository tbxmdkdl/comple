import type { Event, EventChoice, EventEffect, GameId, MetricKey } from "../game";

type EventNodeProps = {
  deckSize: number;
  event: Event;
  selectedChoiceId?: GameId;
  consequence?: string;
  onContinue: () => void;
  onSelect: (choice: EventChoice) => void;
};

const metricLabels: Record<MetricKey, string> = {
  risk: "리스크",
  evidence: "증빙",
  trust: "신뢰",
  pressure: "압박",
  attention: "주의력",
  time: "시간",
};

export function EventNode({
  consequence,
  deckSize,
  event,
  onContinue,
  onSelect,
  selectedChoiceId,
}: EventNodeProps) {
  const selectedChoice = event.choices.find((choice) => choice.id === selectedChoiceId);

  return (
    <section className="event-panel" aria-label="이벤트 선택">
      <div className="event-heading">
        <div>
          <p className="eyebrow">업무 이벤트</p>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
        </div>
        <strong className="deck-size-chip">현재 덱 {deckSize}장</strong>
      </div>

      <div className="event-options" aria-label="이벤트 선택지">
        {event.choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;

          return (
            <button
              className={`event-choice ${isSelected ? "selected" : ""}`}
              disabled={Boolean(selectedChoiceId)}
              key={choice.id}
              onClick={() => onSelect(choice)}
              type="button"
            >
              <strong>{choice.label}</strong>
              <span className="event-consequence-copy">{choice.consequence}</span>
              <span className="event-effect-summary">
                {formatEventEffects(choice.effects)}
              </span>
              <span className="reward-select-label">
                {isSelected ? "선택 완료" : "선택하기"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="event-footer">
        {selectedChoice ? (
          <p className="reward-confirmation">
            {consequence ?? selectedChoice.consequence}
          </p>
        ) : (
          <p className="empty-copy">짧은 선택 하나가 다음 상황의 출발점을 바꿉니다.</p>
        )}
        <button
          className="primary-button"
          disabled={!selectedChoice}
          onClick={onContinue}
          type="button"
        >
          다음 상황으로 진행
        </button>
      </div>
    </section>
  );
}

function formatEventEffects(effects: readonly EventEffect[]): string {
  const summaries = effects.flatMap((effect) => {
    if (effect.type === "addCardToDeck") {
      return ["덱에 기존 조치 카드 1장 추가"];
    }

    return effect.changes.map((change) => {
      const sign = change.amount > 0 ? "+" : "";

      return `${metricLabels[change.resource]} ${sign}${change.amount}`;
    });
  });

  return summaries.length > 0 ? summaries.join(" / ") : "상태 변화 없음";
}
