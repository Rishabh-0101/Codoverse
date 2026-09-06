import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Sign-in failed — no token received.");
      return;
    }
    localStorage.setItem("codoverse_token", token);
    refreshUser(token).then(() => navigate("/"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="app-shell flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-bad text-sm">{error}</p>
        <button onClick={() => navigate("/login")} className="btn-primary">Back to login</button>
      </div>
    );
  }

  return <div className="app-shell flex items-center justify-center text-gray-400">Signing you in…</div>;
}
