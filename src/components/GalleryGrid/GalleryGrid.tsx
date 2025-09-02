import React from "react";
import "./GalleryGrid.css";
export default function GalleryGrid({
  images,
  about,
}: {
  images: string[];
  about: { title: string; text: string; image: string };
}) {
  return (
    <div className="gwrap">
      <div>
        <div className="badge">THƯ VIỆN ẢNH</div>
        <div className="small">
          {images.map((src, i) => (
            <div className="item" key={i}>
              <img src={src} alt="" />
              <div className="caption">Hình ảnh hoạt động năm 20{i}...</div>
            </div>
          ))}
        </div>
      </div>
      <div className="about">
        <div className="text">
          <h3>{about.title}</h3>
          <p>{about.text}</p>
        </div>
        <img src={about.image} alt="" />
      </div>
    </div>
  );
}
