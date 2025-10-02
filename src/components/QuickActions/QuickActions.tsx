import React from "react";
import "./QuickActions.css";

/* SVG icons - kích thước do CSS kiểm soát */
const IconMail = () => (
  <svg viewBox="0 0 24 24" className="tile-svg" aria-hidden>
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z" />
  </svg>
);
const IconCal = () => (
  <svg viewBox="0 0 24 24" className="tile-svg" aria-hidden>
    <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h2V2Zm15 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8h20ZM7 14h4v4H7v-4Z" />
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" className="tile-svg" aria-hidden>
    <path d="M12 2a6 6 0 0 0-6 6v3.586L4.293 13.293A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
  </svg>
);

type CardProps = {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
};

function Tile({ icon, title, text, onClick }: CardProps) {
  return (
    <button type="button" className="tile" onClick={onClick}>
      <span className="tile-cap" aria-hidden />
      <span className="tile-ic" aria-hidden>
        {icon}
      </span>
      <span className="tile-text">
        <span className="tile-tt">{title}</span>
        <span className="tile-sub">{text}</span>
      </span>
    </button>
  );
}

export default function QuickActions() {
  const go = (p: string) => (window.location.href = p);

  return (
    <div className="quick-tiles qa-center">
      <Tile
        icon={<IconMail />}
        title="Thư mời"
        text="Thư mời con cháu"
        onClick={() => go("/invite")}
      />
      <Tile
        icon={<IconCal />}
        title="Ngày giỗ"
        text="Lịch giỗ các bậc tiên nhân"
        onClick={() => go("/death-anniversary")}
      />
      <Tile
        icon={<IconBell />}
        title="Cáo phó"
        text="Thông báo tin buồn"
        onClick={() => go("/obituary")}
      />
    </div>
  );
}
