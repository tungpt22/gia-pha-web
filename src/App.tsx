// src/App.tsx
// ... (các import như hiện tại)
import PrivateRoute from "./routes/PrivateRoute";
import { useAuth } from "./context/AuthContext";
import Users from "./pages/Users/Users";
import ProfileEdit from "./pages/Profile/ProfileEdit";
import Login from "./pages/Login/Login";
import { useLocation, Navigate, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import BangVang from "./pages/BangVang/BangVang";
import CayPhaHe, { type Person } from "./pages/CayPhaHe/CayPhaHe";
import Home from "./pages/Home/Home";
import Quy from "./pages/Quy/Quy";
import SuKien from "./pages/SuKien/SuKien";
import ThanhVien from "./pages/ThanhVien/ThanhVien";
import ThuVienAnh from "./pages/ThuVienAnh/ThuVienAnh";
import "./styles/global.css";
import Events from "./pages/Events/Events";
import Awards from "./pages/Awards/Awards";
import Finance from "./pages/Finance/Finance";
import Media from "./pages/Media/Media";
import News from "./pages/News/News";

function LoginRoute() {
  const { token } = useAuth();
  const location = useLocation();
  if (token) return <Navigate to="/" replace state={{ from: location }} />;
  return <Login />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "60vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Public */}
          {
            <Route
              path="/cay-pha-he"
              element={<CayPhaHe data={persons} title="Cây phả hệ" />}
            />
          }
          <Route path="/thanh-vien" element={<ThanhVien />} />
          <Route path="/bang-vang" element={<BangVang />} />
          <Route path="/su-kien" element={<SuKien />} />
          <Route path="/thu-vien-anh" element={<ThuVienAnh />} />
          <Route path="/quy" element={<Quy />} />

          {/* Login: chặn khi đã đăng nhập */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Cần đăng nhập */}
          <Route
            path="admin/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfileEdit />
              </PrivateRoute>
            }
          />

          {/* Admin routes - yêu cầu đăng nhập */}
          <Route
            path="/admin/events"
            element={
              <PrivateRoute>
                <Events />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/finance"
            element={
              <PrivateRoute>
                <Finance />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/awards"
            element={
              <PrivateRoute>
                <Awards />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <PrivateRoute>
                <Media />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <PrivateRoute>
                <News />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfileEdit />
              </PrivateRoute>
            }
          />

          {/* Not found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
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
