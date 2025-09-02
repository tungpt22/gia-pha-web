import React from "react";
import "./QuickActions.css";
const IconMail = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
  </svg>
);
const IconCal = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h2V2Zm15 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8h20ZM7 14h4v4H7v-4Z" />
  </svg>
);
const IconBell = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a6 6 0 0 0-6 6v3.586L4.293 13.293A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
  </svg>
);
function Item({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="qcard shadow-card">
      <div className="qicon">{icon}</div>
      <div>
        <h4 className="qtitle">{title}</h4>
        <p className="qtext">{text}</p>
      </div>
    </div>
  );
}
export default function QuickActions() {
  return (
    <div className="qgrid">
      <Item icon={<IconMail />} title="Thư mời" text="Thư mời con cháu" />
      <Item
        icon={<IconCal />}
        title="Ngày giỗ"
        text="Lịch giỗ các bậc tiền nhân"
      />
      <Item icon={<IconBell />} title="Cáo phó" text="Thông báo tin buồn" />
    </div>
  );
}
