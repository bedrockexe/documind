import { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askQuestion() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    const res = await fetch("http://localhost:8000/ask-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    // Read the streamed answer piece by piece as it arrives
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 640, margin: "48px auto", fontFamily: "system-ui, sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24 }}>Ask my documents</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          placeholder="Ask a question about your PDF..."
          style={{ flex: 1, padding: 10, fontSize: 16, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          onClick={askQuestion}
          disabled={loading}
          style={{ padding: "10px 20px", fontSize: 16, borderRadius: 8, cursor: "pointer" }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: 24, padding: 16, background: "#f5f5f5", borderRadius: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {answer}
        </div>
      )}
    </div>
  );
}