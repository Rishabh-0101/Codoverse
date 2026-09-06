import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Home from "./pages/Home.jsx";
import Rewind from "./pages/Rewind.jsx";
import Rank from "./pages/Rank.jsx";
import Contests from "./pages/Contests.jsx";
import ContestStats from "./pages/ContestStats.jsx";
import ContestHistory from "./pages/ContestHistory.jsx";
import Profile from "./pages/Profile.jsx";
import Connect from "./pages/Connect.jsx";
import More from "./pages/More.jsx";
import Achievements from "./pages/Achievements.jsx";
import AnalyzeRepo from "./pages/AnalyzeRepo.jsx";
import CompanyKit from "./pages/CompanyKit.jsx";
import Sheets from "./pages/Sheets.jsx";
import Notes from "./pages/Notes.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";
import Settings from "./pages/Settings.jsx";
import ExportData from "./pages/ExportData.jsx";
import ShareCard from "./pages/ShareCard.jsx";
import RatingProgress from "./pages/RatingProgress.jsx";
import Insights from "./pages/Insights.jsx";
import Compare from "./pages/Compare.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/rewind" element={<ProtectedRoute><Rewind /></ProtectedRoute>} />
      <Route path="/rank" element={<ProtectedRoute><Rank /></ProtectedRoute>} />
      <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
      <Route path="/contest-stats" element={<ProtectedRoute><ContestStats /></ProtectedRoute>} />
      <Route path="/contest-history" element={<ProtectedRoute><ContestHistory /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
      <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/analyze-repo" element={<ProtectedRoute><AnalyzeRepo /></ProtectedRoute>} />
      <Route path="/company-kit" element={<ProtectedRoute><CompanyKit /></ProtectedRoute>} />
      <Route path="/sheets" element={<ProtectedRoute><Sheets /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/export-data" element={<ProtectedRoute><ExportData /></ProtectedRoute>} />
      <Route path="/share-card" element={<ProtectedRoute><ShareCard /></ProtectedRoute>} />
      <Route path="/rating-progress" element={<ProtectedRoute><RatingProgress /></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
      <Route path="/u/:handle" element={<PublicProfile />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
