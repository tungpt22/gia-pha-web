import hero from "../../assets/hero.jpg";
import Hero from "../../components/Hero/Hero";
export default function ThuVienAnh() {
  return (
    <>
      <Hero
        background={hero}
        title={<>Thư viện ảnh</>}
        subtitle={<>Dòng họ Nguyễn Văn - Nghệ An</>}
        actions={
          <a className="btn btn-ghost" href="/">
            Về trang chủ
          </a>
        }
      />
      <section className="section">
        <div className="container">
          <h2 style={{ marginTop: 0 }}>Thư viện ảnh — Nội dung</h2>
          <p>
            Trang Thư viện ảnh theo cùng bố cục. Thay nội dung thật theo nhu
            cầu.
          </p>
        </div>
      </section>
    </>
  );
}
