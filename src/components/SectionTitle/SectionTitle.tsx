import React from "react";
import "./SectionTitle.css";
export default function SectionTitle({
  children,
  brand = false,
}: {
  children: React.ReactNode;
  brand?: boolean;
}) {
  return <h2 className={"stitle " + (brand ? "brand" : "")}>{children}</h2>;
}
export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="badge">{children}</span>
);
