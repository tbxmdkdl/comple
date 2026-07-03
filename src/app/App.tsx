import { PlaceholderCard } from "../components/PlaceholderCard";

const resourceLabels = ["리스크", "증거", "신뢰", "압박", "주의력"];

export function App() {
  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        <div className="scenario-panel">
          <p className="eyebrow">MVP 초기 화면</p>
          <h1 id="app-title">업무 리스크 상황판</h1>
          <p className="scenario-copy">
            카드와 시나리오는 다음 티켓에서 연결됩니다.
          </p>
        </div>

        <div className="resource-row" aria-label="현재 자원">
          {resourceLabels.map((label) => (
            <span className="resource-chip" key={label}>
              <strong>{label}</strong>
              <span>--</span>
            </span>
          ))}
        </div>

        <div className="hand-row" aria-label="손패 자리">
          <PlaceholderCard title="카드 슬롯" />
          <PlaceholderCard title="카드 슬롯" />
          <PlaceholderCard title="카드 슬롯" />
        </div>
      </section>
    </main>
  );
}
