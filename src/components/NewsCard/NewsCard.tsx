import "./NewsCard.css";
export default function NewsCard({
  image,
  date,
  month,
  year,
  title,
  excerpt,
}: {
  image: string;
  date: string;
  month: string;
  year: string;
  title: string;
  excerpt: string;
}) {
  return (
    <article className="news shadow-card">
      <div className="img" style={{ backgroundImage: `url(${image})` }} />
      <div className="body">
        <div className="date">
          <div className="d">{date}</div>
          <div className="m">
            {month}
            <br />
            {year}
          </div>
        </div>
        <h3>{title}</h3>
        <p>{excerpt}</p>
      </div>
    </article>
  );
}
