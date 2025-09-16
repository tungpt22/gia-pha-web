import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { isLoggedIn } from "./auth";

// --- Public screens ---
import BangVang from "./pages/BangVang/BangVang";
import CayPhaHe from "./pages/CayPhaHe/CayPhaHe";
import type { Person } from "./pages/CayPhaHe/CayPhaHe";
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
import ProfileEdit from "./pages/Profile/ProfileEdit";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/cay-pha-he"
            element={<CayPhaHe data={persons} title="Cây phả hệ" />}
          />
          <Route path="/thanh-vien" element={<ThanhVien />} />
          <Route path="/bang-vang" element={<BangVang />} />
          <Route path="/su-kien" element={<SuKien />} />
          <Route path="/thu-vien-anh" element={<ThuVienAnh />} />
          <Route path="/quy" element={<Quy />} />
          <Route path="/login" element={<Login />} />

          {/* Admin routes - yêu cầu đăng nhập */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finance"
            element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/awards"
            element={
              <ProtectedRoute>
                <Awards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <Media />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute>
                <News />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const persons: Person[] = [
  {
    id: "r",
    name: "Ông Tổ",
    gender: "Nam",
    isRoot: true,
    spouseIds: ["w1", "w2"],
  },
  { id: "w1", name: "Bà Tổ 1", gender: "Nữ", spouseIds: ["r"] },
  { id: "w2", name: "Bà Tổ 2", gender: "Nữ", spouseIds: ["r"] },
  { id: "c1", name: "Con 1", gender: "Nam", fatherId: "r", motherId: "w1" },
  { id: "c2", name: "Con 2", gender: "Nữ", fatherId: "r", motherId: "w2" },
];
