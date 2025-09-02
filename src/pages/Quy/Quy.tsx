import Hero from "../../components/Hero/Hero";
import hero from "../../assets/hero.jpg";
export default function Quy() {
  return (
    <>
      <Hero
        background={hero}
        title={<>Quỹ</>}
        subtitle={<>Dòng họ Nguyễn Văn - Nghệ An</>}
        actions={
          <a className="btn btn-ghost" href="/">
            Về trang chủ
          </a>
        }
      />
      <section className="section">
        <div className="container">
          <h2 style={{ marginTop: 0 }}>Quỹ — Nội dung</h2>
          <p>Trang Quỹ theo cùng bố cục. Thay nội dung thật theo nhu cầu.</p>
        </div>
      </section>
    </>
  );
}
