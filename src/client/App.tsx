import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { ContactPage } from './pages/ContactPage';
import { PricingPage } from './pages/PricingPage';
import './App.css';

type AgentType = 'support' | 'analytics' | 'content';

interface AgentOption {
  id: AgentType;
  name: string;
  description: string;
  useCase: string;
  placeholder: string;
  icon: string;
}

const AGENTS: AgentOption[] = [
  {
    id: 'support',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries with professional, empathetic responses',
    useCase: 'Reduce support ticket resolution time by 70%',
    placeholder:
      'Example: "My order #1234 arrived damaged and I need a replacement as soon as possible."',
    icon: '🎧'
  },
  {
    id: 'analytics',
    name: 'Data Analytics Agent',
    description: 'Analyzes business data and extracts actionable insights',
    useCase: '4-hour analyses completed in 30 seconds',
    placeholder:
      'Example: "Our Q4 sales dropped 15% vs Q3. Electronics -22%, Clothing +5%. How do we recover?"',
    icon: '📊'
  },
  {
    id: 'content',
    name: 'Content Writer Agent',
    description: 'Generates on-brand marketing content at scale',
    useCase: '10x content production without hiring',
    placeholder:
      'Example: "Write a LinkedIn post announcing our new AI-powered feature. Tone: professional but excited."',
    icon: '✍️'
  }
];

interface AgentResult {
  result: string;
  agentName: string;
  tokensUsed: number;
  processingTime: number;
}

function DemoPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('support');
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAgent = AGENTS.find((a) => a.id === selectedAgent)!;

  const runAgent = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agentType: selectedAgent, context: context || undefined })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Agent failed to respond');
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <h1 className="logo">AgentOS</h1>
          </Link>
          <p className="tagline">AI Agents for your business — live demo</p>
          <nav className="header-nav">
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact" className="nav-cta-sm">Get a demo</Link>
          </nav>
        </div>
      </header>

      <main className="main">
        <section className="agent-selector">
          <h2>Choose your agent</h2>
          <div className="agent-cards">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                className={`agent-card ${selectedAgent === agent.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  setResult(null);
                  setPrompt('');
                }}
              >
                <span className="agent-icon">{agent.icon}</span>
                <span className="agent-name">{agent.name}</span>
                <span className="agent-use-case">{agent.useCase}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="input-section">
            <div className="agent-header">
              <span className="agent-icon-lg">{currentAgent.icon}</span>
              <div>
                <h3>{currentAgent.name}</h3>
                <p>{currentAgent.description}</p>
              </div>
            </div>

            <div className="field">
              <label htmlFor="context">Business context (optional)</label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe your company, product, or relevant context..."
                rows={2}
              />
            </div>

            <div className="field">
              <label htmlFor="prompt">Your request</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentAgent.placeholder}
                rows={4}
              />
            </div>

            <button className="run-btn" onClick={runAgent} disabled={loading || !prompt.trim()}>
              {loading ? 'Agent is working...' : `Run ${currentAgent.name}`}
            </button>
          </div>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="result-header">
                <span>{result.agentName} responded</span>
                <div className="result-meta">
                  <span>{result.tokensUsed} tokens</span>
                  <span>{(result.processingTime / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="result-content">{result.result}</div>
            </div>
          )}
        </section>

        <section className="cta-section">
          <h2>Ready to deploy this agent for your business?</h2>
          <p>
            We customize any agent for your specific workflows, integrate with your tools, and
            deploy in 48 hours.
          </p>
          <div className="cta-buttons">
            <Link to="/contact" className="cta-primary">Book a 15-min demo call</Link>
            <Link to="/pricing" className="cta-secondary">See pricing →</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Powered by Claude claude-sonnet-4-6 · Built for real business workflows</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  );
}
