import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function Notes() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // note being edited, or {} for new
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = () => api.getNotes(token).then((d) => setNotes(d.notes)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startNew = () => {
    setEditing({});
    setTitle("");
    setContent("");
  };

  const startEdit = (note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const save = async () => {
    if (!title.trim()) return;
    if (editing?.id) {
      await api.updateNote(token, editing.id, { title, content });
    } else {
      await api.createNote(token, { title, content });
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    await api.deleteNote(token, id);
    load();
  };

  if (editing !== null) {
    return (
      <div className="app-shell px-4">
        <TopBar title={editing?.id ? "Edit Note" : "New Note"} showBack={false} right={
          <button onClick={() => setEditing(null)} className="text-sm text-gray-400">Cancel</button>
        } />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-panel border border-[#212a45] rounded-xl px-4 py-3 outline-none focus:border-accent mb-3 font-semibold"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note…"
          rows={10}
          className="w-full bg-panel border border-[#212a45] rounded-xl px-4 py-3 outline-none focus:border-accent text-sm"
        />
        <button onClick={save} className="btn-primary w-full mt-4">Save Note</button>
      </div>
    );
  }

  return (
    <div className="app-shell px-4">
      <TopBar title="My Notes" right={
        <button onClick={startNew} className="btn-primary text-sm py-1.5 px-3">+ New</button>
      } />
      {!loading && notes.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-10">No notes yet. Tap "+ New" to add your first one.</p>
      )}
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="card p-4">
            <div className="flex justify-between items-start">
              <button onClick={() => startEdit(n)} className="text-left flex-1">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{n.content || "No content"}</p>
                <p className="text-[10px] text-gray-600 mt-1">{new Date(n.updatedAt).toLocaleString()}</p>
              </button>
              <button onClick={() => remove(n.id)} className="text-bad text-xs ml-3">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
