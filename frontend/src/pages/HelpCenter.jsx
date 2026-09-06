import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function HelpCenter() {
  const { token } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.getFaqs(token).then((d) => setFaqs(d.faqs));
  }, [token]);

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    await api.sendFeedback(token, feedback);
    setFeedback("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="app-shell px-4">
      <TopBar title="Help Center" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Answers to common questions</p>

      <div className="card p-4 flex items-center gap-3 mb-4">
        <span className="text-xl">💬</span>
        <div>
          <p className="font-semibold text-sm">Still need help?</p>
          <p className="text-xs text-gray-400">Reach out to team @ support@codoverse.app</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-400 mb-2">FREQUENTLY ASKED QUESTIONS</p>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full text-left px-4 py-3 flex justify-between items-center"
            >
              <span className="text-sm font-medium pr-3">{f.q}</span>
              <span className="text-gray-400">{openIdx === i ? "−" : "+"}</span>
            </button>
            {openIdx === i && <p className="px-4 pb-3 text-xs text-gray-400">{f.a}</p>}
          </div>
        ))}
      </div>

      <div className="card p-4 mt-5">
        <p className="font-semibold text-sm mb-2">Send Feedback</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="Tell us what's working or what's not…"
          className="w-full bg-panel2 border border-[#212a45] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button onClick={submitFeedback} className="btn-primary w-full mt-3">
          {sent ? "Thanks for your feedback! ✅" : "Send Feedback"}
        </button>
      </div>
    </div>
  );
}
