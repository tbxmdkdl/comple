type PlaceholderCardProps = {
  title: string;
};

export function PlaceholderCard({ title }: PlaceholderCardProps) {
  return (
    <article className="placeholder-card">
      <span className="card-cost">--</span>
      <h2>{title}</h2>
      <p>준비 중</p>
    </article>
  );
}
