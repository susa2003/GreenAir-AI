import React from "react";

interface StatusBadgeProps {
  category: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ category, size = "md" }) => {
  const catLower = (category || "").toLowerCase();

  let bgClass = "bg-emerald-950 text-emerald-400 border-emerald-800";
  let dotClass = "bg-emerald-400";

  if (catLower.includes("moderat")) {
    bgClass = "bg-amber-950 text-amber-400 border-amber-800";
    dotClass = "bg-amber-400";
  } else if (catLower.includes("very poor")) {
    bgClass = "bg-red-950 text-red-400 border-red-800";
    dotClass = "bg-red-400";
  } else if (catLower.includes("poor")) {
    bgClass = "bg-orange-950 text-orange-400 border-orange-800";
    dotClass = "bg-orange-400";
  } else if (catLower.includes("severe")) {
    bgClass = "bg-rose-950 text-rose-300 border-rose-900";
    dotClass = "bg-rose-400";
  }

  const sizeClass = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm font-medium",
    lg: "px-4 py-2 text-lg font-semibold",
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bgClass} ${sizeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />
      {category}
    </span>
  );
};
