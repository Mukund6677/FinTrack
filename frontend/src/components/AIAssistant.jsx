import { useState } from "react";

export default function AIAssistant({ API_URL, token }) {
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I am your FinTrack AI Finance Assistant. I can analyze your spending habits, evaluate your budget discipline, recommend optimal cards for rewards, and calculate your savings rate. Ask a question below or choose a suggestion to get started!"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Where did I spend the most money?",
    "How is my budget health?",
    "Which card gives the best rewards?",
    "How can I improve my savings rate?",
    "Give me an executive summary of my finances"
  ];

  const handleAsk = async (textToAsk = query) => {
    const q = (textToAsk || query).trim();
    if (!q || !token) return;

    setConversation(prev => [...prev, { role: "user", content: q }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai-assistant/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Assistant unavailable");

      setConversation(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setConversation(prev => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Sorry, unable to complete your query: ${err.message}. Please verify your connection or try another query.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-card">
      <div className="section-header">
        <div>
          <h2>FinTrack AI Finance Assistant</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Personalized insights grounded in your verified financial records & budget performance
          </p>
        </div>
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      <div style={{ marginTop: "15px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
          Suggested Inquiries:
        </span>
        <div className="chip-row">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => handleAsk(s)}
              disabled={loading}
            >
              💡 {s}
            </button>
          ))}
        </div>
      </div>

      {/* CONVERSATION HISTORY */}
      <div style={{
        marginTop: "20px",
        maxHeight: "450px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        paddingRight: "8px"
      }}>
        {conversation.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: msg.role === "user" ? "80%" : "95%",
              background: msg.role === "user" ? "var(--primary-base)" : "var(--bg-surface-elevated)",
              color: msg.role === "user" ? "#ffffff" : "var(--text-primary)",
              padding: "16px 20px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              border: msg.role === "user" ? "none" : "1px solid var(--border-default)"
            }}
          >
            {msg.role === "user" ? (
              <p style={{ margin: 0, fontWeight: 500 }}>{msg.content}</p>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "14px" }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start",
            background: "var(--bg-surface-elevated)",
            padding: "12px 18px",
            borderRadius: "12px",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-default)",
            fontSize: "14px"
          }}>
            🤖 Analyzing your financial data...
          </div>
        )}
      </div>

      {/* QUERY INPUT BAR */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAsk();
        }}
        style={{ display: "flex", gap: "10px", marginTop: "20px" }}
      >
        <input
          type="text"
          placeholder="Ask a question about your spending, budget health, savings or cards..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: "14px 18px",
            borderRadius: "10px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: "15px",
            outline: "none"
          }}
        />
        <button
          type="submit"
          className="notion-btn-primary"
          disabled={loading || !query.trim()}
          style={{
            padding: "14px 24px",
            fontWeight: "600",
            borderRadius: "10px",
            opacity: (loading || !query.trim()) ? 0.6 : 1,
            cursor: (loading || !query.trim()) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Thinking..." : "Ask Assistant"}
        </button>
      </form>
    </div>
  );
}
