import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API = "http://localhost:8000/ask-stream";
const EXAMPLES = [
  "What problem does the paper address?",
  "What methodology was used?",
  "What were the main results?",
];
const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const Burst = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>);
const Doc = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h9l7 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M13 4v7h7"/></svg>);
const UserIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>);
const Plus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>);
const CopyIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>);
const RegenIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>);

function Assistant({ msg, canRegen, onRegen }) {
  const [copied, setCopied] = useState(false);
  const [showSrc, setShowSrc] = useState(false);
  const copy = () => { navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const empty = msg.loading && !msg.text;

  return (
    <div className="msg assistant">
      <div className="avatar assistant"><Burst /></div>
      <div className="msg-body">
        <div className="bubble assistant">
          {empty ? <div className="dots"><span /><span /><span /></div>
                 : <div className="md"><ReactMarkdown>{msg.text}</ReactMarkdown></div>}
        </div>
        {!empty && (
          <div className="meta">
            {msg.ts && <span className="time">{fmt(msg.ts)}</span>}
            {msg.text && <button className="act" onClick={copy}><CopyIcon />{copied ? "Copied" : "Copy"}</button>}
            {canRegen && !msg.loading && <button className="act" onClick={onRegen}><RegenIcon />Regenerate</button>}
            {msg.sources?.length > 0 && (
              <button className="act" onClick={() => setShowSrc(s => !s)}><Doc />Sources ({msg.sources.length})</button>
            )}
          </div>
        )}
        {showSrc && msg.sources?.length > 0 && (
          <div className="sources">
            {msg.sources.map((s, i) => (
              <div className="source-card" key={i}>
                <div className="source-head"><Doc />{s.source}</div>
                <div className="source-text">{s.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 820);
  const endRef = useRef(null);
  const taRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages ?? [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, activeId]);

  function patchAssistant(convId, patch) {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const msgs = [...c.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") { msgs[i] = { ...msgs[i], ...patch }; break; }
      }
      return { ...c, messages: msgs };
    }));
  }

  async function streamInto(convId, question) {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("bad status");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const nl = raw.indexOf("\n");
        if (nl !== -1) {
          let sources = [];
          try { sources = JSON.parse(raw.slice(0, nl)); } catch {}
          const answer = raw.slice(nl + 1);
          patchAssistant(convId, { text: answer, sources, loading: answer.length === 0 });
        }
      }
      patchAssistant(convId, { loading: false });
    } catch {
      patchAssistant(convId, { text: "Couldn't reach the server. Make sure the backend and Ollama are running, then try again.", loading: false });
    }
  }

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    let convId = activeId;
    const isNew = !convId;
    if (isNew) convId = crypto.randomUUID();

    setConversations(prev => {
      const base = isNew ? [{ id: convId, title: q.slice(0, 42), messages: [] }, ...prev] : prev;
      return base.map(c => c.id === convId
        ? { ...c,
            title: c.messages.length === 0 ? q.slice(0, 42) : c.title,
            messages: [...c.messages,
              { role: "user", text: q, ts: Date.now() },
              { role: "assistant", text: "", sources: [], loading: true, ts: Date.now() }] }
        : c);
    });
    if (isNew) setActiveId(convId);

    await streamInto(convId, q);
    setBusy(false);
  }

  async function regenerate(convId) {
    if (busy) return;
    const conv = conversations.find(c => c.id === convId);
    const lastUser = conv && [...conv.messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    setBusy(true);
    patchAssistant(convId, { text: "", sources: [], loading: true, ts: Date.now() });
    await streamInto(convId, lastUser.text);
    setBusy(false);
  }

  function newChat() { setActiveId(null); if (window.innerWidth <= 820) setSidebarOpen(false); }
  function openConv(id) { setActiveId(id); if (window.innerWidth <= 820) setSidebarOpen(false); }
  function onKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  function grow(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].role === "assistant") { lastAssistantIdx = i; break; } }

  return (
    <div className="layout">
      <aside className={"sidebar" + (sidebarOpen ? "" : " closed")}>
        <div className="brand">
          <div className="brand-mark"><Doc /></div>
          <div className="brand-name">DocuMind</div>
        </div>
        <button className="new-chat" onClick={newChat}><Plus /> New chat</button>
        <div className="hist-label">Recent</div>
        <div className="hist">
          {conversations.length === 0 && <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--muted-2)" }}>No conversations yet</div>}
          {conversations.map(c => (
            <button key={c.id} className={"hist-item" + (c.id === activeId ? " active" : "")} onClick={() => openConv(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
        <div className="sidebar-foot">Retrieval + reranking over your PDFs. Answers stay grounded in the source text.</div>
      </aside>

      <div className={"scrim" + (sidebarOpen ? " show" : "")} onClick={() => setSidebarOpen(false)} />

      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="topbar-title">{activeConv ? activeConv.title : "New chat"}<span>Ask questions about your documents</span></div>
          <div className="badge"><span className="dot" /> Local · reranked</div>
        </header>

        <div className="thread">
          {messages.length === 0 ? (
            <div className="empty">
              <div className="empty-mark"><Doc /></div>
              <h2>Ask your documents anything</h2>
              <p>Every answer is pulled from the PDFs you loaded and shows the exact passages it used. Try one of these to start:</p>
              <div className="chips">
                {EXAMPLES.map((ex, i) => <button className="chip" key={i} onClick={() => send(ex)}>{ex}</button>)}
              </div>
            </div>
          ) : (
            <div className="thread-inner">
              {messages.map((m, i) => m.role === "user" ? (
                <div className="msg user" key={i}>
                  <div className="avatar user"><UserIcon /></div>
                  <div className="msg-body">
                    <div className="bubble user">{m.text}</div>
                    <div className="meta">{m.ts && <span className="time">{fmt(m.ts)}</span>}</div>
                  </div>
                </div>
              ) : (
                <Assistant key={i} msg={m} canRegen={i === lastAssistantIdx} onRegen={() => regenerate(activeId)} />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="composer">
          <div className="composer-inner">
            <div className="input-wrap">
              <textarea ref={taRef} rows={1} value={input} onChange={grow} onKeyDown={onKey} placeholder="Ask a question about your documents..." />
              <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()}>↑</button>
            </div>
            <p className="composer-note">Answers are generated from your documents and may be imperfect. Enter to send · Shift+Enter for a new line.</p>
          </div>
        </div>
      </main>
    </div>
  );
}