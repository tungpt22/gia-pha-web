import React from "react";
import "./Tabs.css";
export default function Tabs({ images }: { images: string[] }) {
  const [tab, setTab] = React.useState<"anh" | "video">("anh");
  return (
    <div>
      <div className="tabs">
        <button
          className={"tab " + (tab === "anh" ? "active" : "")}
          onClick={() => setTab("anh")}
        >
          Ảnh
        </button>
        <button
          className={"tab " + (tab === "video" ? "active" : "")}
          onClick={() => setTab("video")}
        >
          Video
        </button>
      </div>
      <div className="tabwrap">
        {tab === "anh" ? (
          <div className="grid2">
            <div className="card">
              <img src={images[0]} />
            </div>
            <div className="card">
              <img src={images[1]} />
            </div>
          </div>
        ) : (
          <div className="video">Nhúng video tại đây</div>
        )}
      </div>
    </div>
  );
}
