import { useState, useEffect, useRef } from "react";
import "./Landing.css";

const IDoc = (p) => (<svg width={p.s || 18} height={p.s || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h9l7 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M13 4v7h7"/></svg>);
const IArrow = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
const ITarget = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>);
const ILines = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h12M8 12h12M8 18h9"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>);
const ISliders = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h10M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>);
const IShield = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>);
const IBurst = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>);
const IUser = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>);

function Typewriter({ text, speed = 26, delay = 600 }) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0, t;
    const start = setTimeout(function tick() {
      setOut(text.slice(0, i));
      if (i <= text.length) { i += 1; t = setTimeout(tick, speed); }
    }, delay);
    return () => { clearTimeout(start); clearTimeout(t); };
  }, [text, speed, delay]);
  return <>{out}<span className="caret" /></>;
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

const FEATURES = [
  { icon: <ITarget />, title: "Grounded in your sources", text: "Answers come straight from your documents — not the model guessing. If it isn't in the text, it says so." },
  { icon: <ILines />, title: "Shows its receipts", text: "Every answer reveals the exact passages it used, so you can check it against the source in one click." },
  { icon: <ISliders />, title: "Sharper retrieval", text: "A reranking step re-scores results so the most relevant text is what reaches the answer." },
  { icon: <IShield />, title: "Runs on your machine", text: "Your documents never leave your computer. Fully local, fully private, nothing sent anywhere." },
];
const STEPS = [
  { title: "Load your PDFs", text: "Drop in your documents and they're indexed and ready to search in seconds." },
  { title: "Ask in plain language", text: "Type a question the way you'd ask a colleague. No syntax, no setup." },
  { title: "Get a grounded answer", text: "Read the answer streamed in real time, with its sources attached." },
];

export default function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const stepsRef = useRef(null);
  const launch = () => { setLeaving(true); setTimeout(() => onEnter(), 500); };
  const toSteps = () => stepsRef.current?.scrollIntoView({ behavior: "smooth" });
  const docs = Array.from({ length: 6 });

  return (
    <div className={"landing" + (leaving ? " leaving" : "")}>
      <div className="bg">
        <div className="orb v" /><div className="orb c" /><div className="orb m" />
        <div className="grid" />
        {docs.map((_, i) => (
          <div key={i} className="floatdoc" style={{ left: `${8 + i * 15}%`, bottom: `${-40 + (i % 3) * 10}px`, animationDuration: `${14 + i * 3}s`, animationDelay: `${i * 2.5}s` }}><IDoc s={26} /></div>
        ))}
      </div>

      <div className="wrap">
        <nav className="nav">
          <div className="nav-brand"><div className="nav-mark"><IDoc /></div><div className="nav-name">DocuMind</div></div>
          <button className="nav-cta" onClick={launch}>Launch app</button>
        </nav>

        <header className="hero">
          <div className="hero-copy">
            <div className="eyebrow enter d1"><span className="pulse" /> Grounded document AI</div>
            <h1 className="enter d2">Chat with your documents.<br /><span className="grad">Get answers you can trust.</span></h1>
            <p className="lead enter d3">DocuMind reads the PDFs you give it and answers your questions using the actual text — and shows you the exact passages behind every answer.</p>
            <div className="hero-actions enter d4">
              <button className="btn-primary" onClick={launch}>Launch DocuMind <IArrow /></button>
              <button className="btn-ghost" onClick={toSteps}>See how it works</button>
            </div>
            <div className="trust enter d5">
              <span><i className="d" /> Local model</span>
              <span><i className="d" /> Source-cited</span>
              <span><i className="d" /> Real-time streaming</span>
            </div>
          </div>

          <div className="preview enter d3">
            <div className="preview-card">
              <div className="preview-glow" />
              <div className="pv-head"><span className="pv-dot r" /><span className="pv-dot y" /><span className="pv-dot g" /><span className="pv-title">DocuMind</span></div>
              <div className="pv-row user"><div className="pv-av u"><IUser /></div><div className="pv-bubble u">What were the main findings of the paper?</div></div>
              <div className="pv-row"><div className="pv-av a"><IBurst /></div><div className="pv-bubble a"><Typewriter text="The fine-tuned model outperformed the baseline across every benchmark, with the largest gains on the harder, low-context examples." /></div></div>
              <div className="pv-source"><div className="s-head"><IDoc s={12} /> research-paper.pdf · page 7</div><div className="s-text">“…improvements were most pronounced on the challenging subset, where accuracy rose by a wide margin over the baseline…”</div></div>
            </div>
          </div>
        </header>

        <section className="section">
          <Reveal className="section-head"><div className="kicker">Why DocuMind</div><h2>Answers you can actually rely on</h2><p>Most AI tools sound confident even when they're wrong. DocuMind only answers from your documents — and proves it.</p></Reveal>
          <div className="features">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 90}><div className="feature"><div className="feature-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.text}</p></div></Reveal>
            ))}
          </div>
        </section>

        <section className="section" ref={stepsRef}>
          <Reveal className="section-head"><div className="kicker">How it works</div><h2>Three steps to grounded answers</h2><p>From a folder of PDFs to trustworthy answers, without any setup.</p></Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 110}><div className="step"><div className="step-num">{i + 1}</div><h3>{s.title}</h3><p>{s.text}</p></div></Reveal>
            ))}
          </div>
        </section>

        <Reveal>
          <div className="cta-band"><h2>Ready to talk to your documents?</h2><p>Ask your first question in seconds.</p><button className="btn-primary" onClick={launch}>Launch DocuMind <IArrow /></button></div>
        </Reveal>

        <footer className="foot">
          <div className="f-brand"><span className="m"><IDoc s={14} /></span> DocuMind</div>
          <p>Retrieval-augmented answers over your own PDFs · runs locally</p>
        </footer>
      </div>
    </div>
  );
}