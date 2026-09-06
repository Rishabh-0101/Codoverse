import React from "react";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title, showBack = true, right = null, onBack }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-panel border border-[#212a45] text-gray-300 shrink-0"
          >
            ←
          </button>
        )}
        <h1 className="font-display font-semibold text-lg truncate">{title}</h1>
      </div>
      {right}
    </div>
  );
}
