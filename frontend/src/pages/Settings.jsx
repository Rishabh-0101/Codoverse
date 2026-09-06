import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import { useNavigate, Link } from "react-router-dom";

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${checked ? "bg-accent" : "bg-gray-600"} ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
          checked ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { token, user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    api.getSettings(token).then((d) => setSettings(d.settings)).catch((err) => setError(err.message));
  }, [token]);

  const updateSetting = async (key, value) => {
    setError("");
    const prev = settings;
    setSettings({ ...settings, [key]: value }); // optimistic
    setSavingKey(key);
    try {
      await api.updateSettings(token, { [key]: value });
    } catch (err) {
      setSettings(prev); // revert on failure — never silently navigate away
      if (err.status === 401) {
        setError("Your session expired. Please log in again.");
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 1500);
      } else {
        setError(err.message);
      }
    } finally {
      setSavingKey(null);
    }
  };

  const saveProfile = async () => {
    try {
      const data = await api.updateProfile(token, { name });
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("This will permanently delete your Codoverse account and all data. Continue?")) return;
    try {
      await api.deleteAccount(token);
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell px-4">
      <TopBar title="Settings" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Manage your account preferences</p>

      {error && <p className="text-bad text-xs bg-bad/10 rounded-lg px-3 py-2 mb-3">{error}</p>}

      <div className="card p-4 flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center shrink-0">
          {user?.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveProfile}
            className="bg-transparent font-semibold text-sm outline-none w-full"
          />
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {settings && (
        <>
          <p className="text-xs font-semibold text-gray-400 mb-2">NOTIFICATIONS</p>
          <div className="card divide-y divide-[#212a45] mb-4">
            <Row label="Push notifications" desc="Activity & streak reminders">
              <Toggle
                checked={!!settings.pushNotifications}
                disabled={savingKey === "pushNotifications"}
                onChange={(v) => updateSetting("pushNotifications", v)}
              />
            </Row>
            <Row label="Weekly email digest" desc="Summary of your progress">
              <Toggle
                checked={!!settings.weeklyDigest}
                disabled={savingKey === "weeklyDigest"}
                onChange={(v) => updateSetting("weeklyDigest", v)}
              />
            </Row>
          </div>

          <p className="text-xs font-semibold text-gray-400 mb-2">PRIVACY</p>
          <div className="card divide-y divide-[#212a45] mb-4">
            <Row label="Public profile" desc="Anyone can view your profile">
              <Toggle
                checked={!!settings.publicProfile}
                disabled={savingKey === "publicProfile"}
                onChange={(v) => updateSetting("publicProfile", v)}
              />
            </Row>
            {settings.publicProfile && user?.handle && (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500 mb-2">Your shareable link</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/u/${user.handle}`}
                    className="flex-1 min-w-0 bg-panel2 rounded-lg px-3 py-2 text-xs text-gray-300 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/u/${user.handle}`).catch(() => {})}
                    className="btn-outline text-xs px-3 py-2 shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-xs font-semibold text-gray-400 mb-2">ACCOUNT</p>
      <div className="card divide-y divide-[#212a45] mb-6">
        <Link to="/export-data" className="w-full text-left px-4 py-3 text-sm block">Export my data</Link>
        <button type="button" onClick={deleteAccount} className="w-full text-left px-4 py-3 text-sm text-bad">
          Delete account
        </button>
      </div>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}
