import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  industry: string;
  mainProblem: string;
  companySize: string;
  currentSolution: string;
  agentType: 'support' | 'analytics' | 'content';
  price: number;
}

interface AgentResult {
  result: string;
  agentName: string;
  tokensUsed: number;
  processingTime: number;
}

const AGENT_META = {
  support: {
    icon: '🎧',
    name: 'Agente de Atención al Cliente',
    label: (industry: string) => `Configurado para ${industry}`,
    contextTemplate: (lead: Lead) =>
      `Empresa: ${lead.companyName}. Industria: ${lead.industry}. Contexto: ${lead.mainProblem}. Responde como agente de soporte profesional de esta empresa.`,
    examplePrompts: (lead: Lead) => [
      `Hola, quisiera saber más sobre los servicios de ${lead.companyName}`,
      `¿Cuáles son los horarios de atención?`,
      `Tuve un problema con mi último pedido, ¿pueden ayudarme?`
    ]
  },
  analytics: {
    icon: '📊',
    name: 'Agente de Análisis de Datos',
    label: (industry: string) => `Especializado en ${industry}`,
    contextTemplate: (lead: Lead) =>
      `Analista de negocios para ${lead.companyName} en el sector ${lead.industry}. Problema actual: ${lead.mainProblem}. Da insights específicos y accionables.`,
    examplePrompts: (lead: Lead) => [
      `Nuestras ventas bajaron 20% este mes, ¿qué puede estar pasando?`,
      `¿Cómo podemos mejorar la retención de clientes en ${lead.industry}?`,
      `Dame 3 métricas clave que debería estar midiendo`
    ]
  },
  content: {
    icon: '✍️',
    name: 'Agente de Contenido y Marketing',
    label: (industry: string) => `Especialista en ${industry}`,
    contextTemplate: (lead: Lead) =>
      `Copywriter para ${lead.companyName}, empresa de ${lead.industry}. Escribe contenido que conecte con su audiencia objetivo. Tono: profesional pero cercano.`,
    examplePrompts: (lead: Lead) => [
      `Escribe un post de Instagram para anunciar una promoción especial`,
      `Crea un mensaje de WhatsApp para re-activar clientes inactivos`,
      `Redacta una descripción para el perfil de Google de ${lead.companyName}`
    ]
  }
};

export function DemoPersonalizedPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLead, setLoadingLead] = useState(true);
  const [error, setError] = useState('');
  const [runCount, setRunCount] = useState(0);
  const [paid] = useState(() => new URLSearchParams(window.location.search).get('paid') === '1');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/qualify/lead/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setLead(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingLead(false));
  }, [id]);

  const runAgent = async (usePrompt?: string) => {
    const finalPrompt = usePrompt || prompt;
    if (!finalPrompt.trim() || !lead) return;
    setLoading(true);
    setError('');
    setResult(null);

    const meta = AGENT_META[lead.agentType];
    const context = meta.contextTemplate(lead);

    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, agentType: lead.agentType, context })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'El agente no pudo responder');
      }

      const data = await res.json();
      setResult(data);
      setRunCount((c) => c + 1);
    } catch (e: any) {
      setError(e.message || 'Algo salió mal, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingLead) {
    return (
      <div className="demo-personalized-loading">
        <div className="loading-spinner" />
        <p>Cargando demo...</p>
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="demo-personalized-notfound">
        <h2>Demo no encontrada</h2>
        <p>Este link de demo ya no está disponible.</p>
        <Link to="/" className="btn-primary">Ver demo general</Link>
      </div>
    );
  }

  const meta = AGENT_META[lead.agentType];
  const examples = meta.examplePrompts(lead);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <h1 className="logo">AgentOS</h1>
          </Link>
          <div className="personalized-demo-badge">
            Demo exclusiva para <strong>{lead.companyName}</strong>
          </div>
          <nav className="header-nav">
            <Link to="/contact" className="nav-cta-sm">Hablar con un experto</Link>
          </nav>
        </div>
      </header>

      {paid && (
        <div className="paid-banner">
          Pago recibido — tu agente está siendo configurado. Te contactaremos en menos de 24h.
        </div>
      )}

      <main className="main">
        {/* Hero personalizado */}
        <section className="personalized-hero">
          <div className="personalized-hero-label">
            {meta.icon} {meta.label(lead.industry)}
          </div>
          <h2 className="personalized-hero-title">
            {meta.name} para {lead.companyName}
          </h2>
          <p className="personalized-hero-sub">
            Configurado para resolver: <em>{lead.mainProblem}</em>
          </p>
        </section>

        {/* Demo panel */}
        <section className="demo-panel">
          <div className="input-section">
            <div className="agent-header">
              <span className="agent-icon-lg">{meta.icon}</span>
              <div>
                <h3>{meta.name}</h3>
                <p>El agente ya conoce el contexto de {lead.companyName}</p>
              </div>
            </div>

            {/* Ejemplos rápidos */}
            <div className="example-prompts">
              <span className="example-prompts-label">Prueba con:</span>
              <div className="example-chips">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    className="example-chip"
                    onClick={() => {
                      setPrompt(ex);
                      runAgent(ex);
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="prompt">O escribe tu propia consulta</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Escribe algo que un cliente de ${lead.companyName} preguntaría...`}
                rows={3}
              />
            </div>

            <button
              className="run-btn"
              onClick={() => runAgent()}
              disabled={loading || !prompt.trim()}
            >
              {loading ? 'Agente trabajando...' : 'Enviar al agente'}
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
                <span>{result.agentName} respondió</span>
                <div className="result-meta">
                  <span>{result.tokensUsed} tokens</span>
                  <span>{(result.processingTime / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="result-content">{result.result}</div>
            </div>
          )}
        </section>

        {/* CTA de cierre */}
        <section className="personalized-cta">
          <div className="personalized-cta-left">
            <h2>¿Quieres este agente funcionando en {lead.companyName}?</h2>
            <p>
              Lo configuramos con tus datos reales, lo integramos con las herramientas
              que ya usan y lo entregamos en 48 horas.
            </p>
            <ul className="personalized-cta-list">
              <li>Configuración completa incluida</li>
              <li>30 días de soporte directo</li>
              <li>Sin mensualidad el primer mes</li>
            </ul>
          </div>
          <div className="personalized-cta-right">
            <div className="personalized-price">
              <span className="personalized-price-amount">${lead.price}</span>
              <span className="personalized-price-period">USD / pago único</span>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hola, vi la demo de ${lead.companyName} y quiero activar el agente`)}`}
              target="_blank"
              rel="noreferrer"
              className="cta-primary"
            >
              Lo quiero — hablar ahora
            </a>
            <p className="personalized-cta-fine">
              Te contactamos en menos de 2 horas en horario hábil
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>AgentOS · Demo exclusiva para {lead.companyName} · Powered by Claude claude-sonnet-4-6</p>
      </footer>
    </div>
  );
}
