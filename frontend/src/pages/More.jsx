import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BottomNav from "../components/BottomNav.jsx";

const ITEMS = [
  { to: "/rewind", icon: "⏪", label: "Monthly Rewind", desc: "Real recap" },
  { to: "/rating-progress", icon: "📈", label: "Rating Progress", desc: "Real trend over time" },
  { to: "/insights", icon: "💡", label: "Insights", desc: "Languages, records, activity" },
  { to: "/compare", icon: "⚔️", label: "Compare with a Friend", desc: "Live, real, no account needed" },
  { to: "/contest-stats", icon: "📊", label: "Contest Stats", desc: "Full history, by month" },
  { to: "/contest-history", icon: "🥇", label: "Contests Won", desc: "Every real #1 finish" },
  { to: "/share-card", icon: "🪪", label: "Share Card", desc: "Shareable stats card" },
  { to: "/achievements", icon: "🏆", label: "Achievements", desc: "Badges & XP" },
  { to: "/analyze-repo", icon: "🔍", label: "Analyze a Repo", desc: "AI code quality" },
  { to: "/company-kit", icon: "🏢", label: "Company Wise Kit", desc: "Curated by company" },
  { to: "/sheets", icon: "📋", label: "DSA Sheets", desc: "Track progress" },
  { to: "/rank", icon: "🥇", label: "Leaderboard", desc: "Real users only" },
  { to: "/notes", icon: "📝", label: "My Notes", desc: "Your notes" },
  { to: "/connect", icon: "🔗", label: "Connect", desc: "Link platforms" },
  { to: "/help", icon: "❓", label: "Help Center", desc: "FAQs & support" },
  { to: "/settings", icon: "⚙️", label: "Settings", desc: "Preferences" }
];

export default function More() {
  const { user } = useAuth();
  return (
    <div className="app-shell px-4">
      <div className="pt-5 pb-3">
        <h1 className="text-xl font-display font-bold">More</h1>
        <p className="text-xs text-gray-400">All pages and features</p>
      </div>

      <div className="card p-3 flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center">
          {user?.avatarInitials}
        </div>
        <div>
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-xs text-gray-400">C-Score {user?.cScore ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="card p-4">
            <span className="text-2xl">{item.icon}</span>
            <p className="font-semibold text-sm mt-2">{item.label}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
