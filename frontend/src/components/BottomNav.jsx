import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: "⬛" },
  { to: "/contests", label: "Contests", icon: "🏆" },
  { to: "/profile", label: "Profile", icon: "👤" },
  { to: "/more", label: "More", icon: "⋯" }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] md:max-w-[640px] lg:max-w-[880px] bg-[#0e1326]/95 backdrop-blur border-t border-[#212a45] flex justify-around py-2 z-40">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-1 text-xs ${
              isActive ? "text-good" : "text-gray-400"
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
