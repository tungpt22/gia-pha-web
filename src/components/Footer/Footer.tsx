import React from "react";
import "./Footer.css";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container section">
        <h3>GIA PHẢ HỌ NGUYỄN VĂN</h3>
        <p>
          Tộc Trưởng: Nguyễn Văn A (đời thứ _)
          <br />
          Liên hệ : Ông Nguyễn Văn B (đại diện) · SĐT: 0123456789 · Địa chỉ: Xã
          Đại Đồng, Huyện Thanh Chương, Tỉnh Nghệ An
          <br />
          Email: nguyenvan@example.com · Website: giaphahonguyenvan.com
        </p>
        <div className="icons">
          <span className="icon">✉️</span>
          <span className="icon">📘</span>
          <span className="icon">▶️</span>
        </div>
        <div className="copy">
          Mọi chi tiết về việc chỉnh sửa nội dung ở trang website, vui lòng liên
          hệ Ông Nguyễn Văn B
        </div>
      </div>
    </footer>
  );
}
