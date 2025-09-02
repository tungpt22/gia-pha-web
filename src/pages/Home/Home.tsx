import Hero from "../../components/Hero/Hero";
import QuickActions from "../../components/QuickActions/QuickActions";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import NewsCard from "../../components/NewsCard/NewsCard";
import GalleryGrid from "../../components/GalleryGrid/GalleryGrid";
import Tabs from "../../components/Tabs/Tabs";
import hero from "../../assets/hero.jpg";
import "./Home.css";
export default function Home() {
  return (
    <>
      <Hero
        background={hero}
        title={<>Dòng họ Nguyễn Văn - Nghệ An</>}
        subtitle={<>Đoàn kết - Phát triển - Rạng danh gia tộc</>}
        actions={
          <>
            <a className="btn btn-ghost" href="/cay-pha-he">
              Xem cây phả hệ
            </a>
            <a className="btn btn-primary" href="/thanh-vien">
              Đăng ký thành viên
            </a>
          </>
        }
      />
      <section className="section section--beige">
        <div className="container">
          <QuickActions />
        </div>
      </section>
      <section className="section section--brand">
        <div className="container">
          <SectionTitle brand>Tin tức và Hoạt động</SectionTitle>
          <div className="grid">
            <NewsCard
              image={hero}
              date="22"
              month="07"
              year="2025"
              title="Họp mặt con cháu dòng họ Nguyễn Văn tại Hà Nội"
              excerpt="Ngày 22/7/2025 tại nhà hàng Hoàng Gia, Hà Nội, đã diễn ra buổi họp mặt con cháu họ Nguyễn Văn tại Hà Nội..."
            />
            <NewsCard
              image={hero}
              date="20"
              month="06"
              year="2025"
              title="THƯ NGỎ - Kêu gọi đóng góp xây dựng Nhà thờ Họ A"
              excerpt="Kính gửi: Toàn thể các bác, các chú, các anh, các con cháu trong dòng tộc..."
            />
            <NewsCard
              image={hero}
              date="08"
              month="06"
              year="2025"
              title="Dòng họ Nguyễn Văn khen thưởng các em học sinh, sinh viên"
              excerpt="Dịp kết thúc năm học, Ban khuyến học đã tổ chức tuyên dương, khen thưởng các cháu có thành tích xuất sắc..."
            />
          </div>
        </div>
      </section>
      <section className="section section--beige">
        <div className="container">
          <SectionTitle>Sự kiện sắp diễn ra</SectionTitle>
          <GalleryGrid
            images={[hero, hero, hero, hero, hero, hero]}
            about={{
              title: "Về dòng họ",
              text: "Dòng họ Nguyễn Văn ở Thanh Chương, Nghệ An là một dòng họ phát triển và có thể có nhiều chi nhánh khác nhau...",
              image: hero,
            }}
          />
        </div>
      </section>
      <section className="section section--brand">
        <div className="container">
          <SectionTitle brand>Thư viện ảnh và Video</SectionTitle>
          <Tabs images={[hero, hero]} />
        </div>
      </section>
    </>
  );
}
