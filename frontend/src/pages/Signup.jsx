import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OAuthButtons from "../components/OAuthButtons.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell flex flex-col justify-center px-6 pb-0">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-2xl font-bold mb-3">
          C
        </div>
        <h1 className="text-2xl font-display font-bold">Create your account</h1>
        <p className="text-gray-400 text-sm mt-1">Start building your Codoverse profile</p>
      </div>

      <OAuthButtons />

      <form onSubmit={submit} className="space-y-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-panel border border-[#212a45] rounded-xl px-4 py-3 outline-none focus:border-accent"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-panel border border-[#212a45] rounded-xl px-4 py-3 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-panel border border-[#212a45] rounded-xl px-4 py-3 outline-none focus:border-accent"
        />
        {error && <p className="text-bad text-sm">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account..." : "Sign Up with Email"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6 mb-6">
        Already have an account?{" "}
        <Link to="/login" className="text-accent font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
