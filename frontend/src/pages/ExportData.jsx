import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function ExportData() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.exportData(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codoverse-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Export my data" />
        <p className="text-bad text-sm text-center mt-10">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="app-shell flex items-center justify-center text-gray-400">Loading your data…</div>;
  }

  const platformsConnected = Object.entries(data.platforms || {}).filter(([, v]) => v);
  const sheetsSolved = Object.keys(data.sheetsProgress || {}).length;
  const companySolved = Object.keys(data.companyProgress || {}).length;
  const unlockedAchievements = (data.achievements || []).filter((a) => a.unlocked);

  return (
    <div className="app-shell px-4">
      <TopBar title="Export my data" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Everything Codoverse has stored about your account</p>

      <Section title="Profile">
        <Field label="Name" value={data.profile?.name} />
        <Field label="Handle" value={`@${data.profile?.handle}`} />
        <Field label="Email" value={data.profile?.email} />
        <Field label="Joined" value={data.profile?.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : "—"} />
      </Section>

      <Section title="Connected platforms">
        {platformsConnected.length === 0 ? (
          <p className="text-xs text-gray-500">None connected yet</p>
        ) : (
          platformsConnected.map(([k, v]) => <Field key={k} label={k} value={v} />)
        )}
      </Section>

      {data.platformStats && (
        <Section title="Last sync">
          <Field label="Synced at" value={new Date(data.platformStats.syncedAt).toLocaleString()} />
          {Object.keys(data.platformStats.results || {}).map((p) => (
            <Field key={p} label={p} value="✓ real data stored" />
          ))}
        </Section>
      )}

      <Section title="Activity">
        <Field label="Notes saved" value={data.notes?.length ?? 0} />
        <Field label="Sheet problems checked off" value={sheetsSolved} />
        <Field label="Company-kit problems checked off" value={companySolved} />
        <Field label="Achievements unlocked" value={`${unlockedAchievements.length} / ${data.achievements?.length ?? 0}`} />
      </Section>

      <Section title="Settings">
        <Field label="Push notifications" value={data.settings?.pushNotifications ? "On" : "Off"} />
        <Field label="Weekly email digest" value={data.settings?.weeklyDigest ? "On" : "Off"} />
        <Field label="Public profile" value={data.settings?.publicProfile ? "On" : "Off"} />
      </Section>

      <button onClick={downloadJson} className="btn-primary w-full mt-2 mb-6">
        Download full backup as JSON
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 mb-2">{title.toUpperCase()}</p>
      <div className="card divide-y divide-[#212a45]">{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 gap-3">
      <span className="text-xs text-gray-500 capitalize">{label}</span>
      <span className="text-sm font-medium text-right truncate max-w-[60%]">{value ?? "—"}</span>
    </div>
  );
}
