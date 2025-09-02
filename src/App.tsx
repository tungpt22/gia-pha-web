import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

// --- Public screens ---
import BangVang from "./pages/BangVang/BangVang";
import CayPhaHe from "./pages/CayPhaHe/CayPhaHe";
import Home from "./pages/Home/Home";
import Quy from "./pages/Quy/Quy";
import SuKien from "./pages/SuKien/SuKien";
import ThanhVien from "./pages/ThanhVien/ThanhVien";
import ThuVienAnh from "./pages/ThuVienAnh/ThuVienAnh";

// --- Admin screens ---
import Awards from "./pages/Awards/Awards";
import Events from "./pages/Events/Events";
import Finance from "./pages/Finance/Finance";
import Login from "./pages/Login/Login";
import Media from "./pages/Media/Media";
import News from "./pages/News/News";
import Users from "./pages/Users/Users";

export default function App() {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cay-pha-he" element={<CayPhaHe />} />
          <Route path="/thanh-vien" element={<ThanhVien />} />
          <Route path="/bang-vang" element={<BangVang />} />
          <Route path="/su-kien" element={<SuKien />} />
          <Route path="/thu-vien-anh" element={<ThuVienAnh />} />
          <Route path="/quy" element={<Quy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/events" element={<Events />} />
          <Route path="/admin/finance" element={<Finance />} />
          <Route path="/admin/awards" element={<Awards />} />
          <Route path="/admin/media" element={<Media />} />
          <Route path="/admin/news" element={<News />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
