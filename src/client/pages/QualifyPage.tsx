import { useState } from 'react';
import { Link } from 'react-router-dom';

interface LeadForm {
  companyName: string;
  contactName: string;
  industry: string;
  mainProblem: string;
  companySize: 'solo' | '2_10' | '11_50' | 'over_50';
  currentSolution: string;
  agentType: 'support' | 'analytics' | 'content';
  price: number;
}

interface QualifyResult {
  lead: { id: string };
  demoUrl: string;
  whatsappMessage: string;
  proposalText: string;
}

const INDUSTRIES = [
  'Restaurante / Gastronomía',
  'Retail / Tienda',
  'Inmobiliaria',
  'Salud / Clínica',
  'Educación',
  'Servicios profesionales',
  'E-commerce',
  'Construcción',
  'Tecnología',
  'Manufactura',
  'Otra'
];

const AGENT_OPTIONS = [
  { id: 'support', label: 'Atención al cliente', icon: '🎧', desc: 'Responde consultas, quejas, seguimientos' },
  { id: 'analytics', label: 'Análisis de datos', icon: '📊', desc: 'Interpreta métricas, reportes, tendencias' },
  { id: 'content', label: 'Contenido y marketing', icon: '✍️', desc: 'Posts, emails, copies publicitarios' }
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? 'Copiado' : label}
    </button>
  );
}

export function QualifyPage() {
  const [form, setForm] = useState<LeadForm>({
    companyName: '',
    contactName: '',
    industry: '',
    mainProblem: '',
    companySize: '2_10',
    currentSolution: '',
    agentType: 'support',
    price: 800
  });

  const [result, setResult] = useState<QualifyResult | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof LeadForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.companyName || !form.contactName || !form.industry || !form.mainProblem) {
      setError('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setPaymentUrl(null);

    try {
      const res = await fetch('/api/qualify/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Error al crear lead');
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayment = async () => {
    if (!result) return;
    setLoadingPayment(true);

    try {
      const res = await fetch('/api/qualify/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: result.lead.id })
      });

      if (!res.ok) throw new Error('Error al generar link');
      const data = await res.json();
      setPaymentUrl(data.paymentUrl);

      if (result) {
        setResult((prev) =>
          prev ? { ...prev, proposalText: data.proposalText } : prev
        );
      }
    } catch {
      setError('No se pudo generar el link de pago (verifica STRIPE_SECRET_KEY)');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="qualify-page">
      <div className="qualify-header">
        <Link to="/" className="nav-logo">AgentOS</Link>
        <div className="qualify-header-right">
          <span className="qualify-badge">Herramienta de operador</span>
        </div>
      </div>

      <div className="qualify-layout">
        {/* LEFT — form */}
        <div className="qualify-form-panel">
          <h1 className="qualify-title">Calificar prospecto</h1>
          <p className="qualify-subtitle">
            Completa con lo que el prospecto te dijo en WhatsApp.
            Genera la demo, el mensaje y el link de pago en segundos.
          </p>

          <div className="qualify-form">
            <div className="qualify-section-label">Empresa</div>

            <div className="form-row">
              <div className="field">
                <label>Nombre de la empresa *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="Ej: La Pasta Feliz"
                />
              </div>
              <div className="field">
                <label>Nombre del contacto *</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="Ej: María García"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Industria *</label>
                <select
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tamaño</label>
                <select
                  value={form.companySize}
                  onChange={(e) => set('companySize', e.target.value as any)}
                >
                  <option value="solo">Solo / freelance</option>
                  <option value="2_10">2 a 10 personas</option>
                  <option value="11_50">11 a 50 personas</option>
                  <option value="over_50">Más de 50</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Problema principal que mencionaron *</label>
              <textarea
                value={form.mainProblem}
                onChange={(e) => set('mainProblem', e.target.value)}
                placeholder="Ej: Pierden mucho tiempo respondiendo las mismas preguntas de clientes por WhatsApp"
                rows={2}
              />
            </div>

            <div className="field">
              <label>¿Qué usan hoy para resolverlo?</label>
              <input
                type="text"
                value={form.currentSolution}
                onChange={(e) => set('currentSolution', e.target.value)}
                placeholder="Ej: Lo hace manualmente el dueño, Excel, nada"
              />
            </div>

            <div className="qualify-section-label" style={{ marginTop: '0.5rem' }}>Agente y precio</div>

            <div className="field">
              <label>Tipo de agente</label>
              <div className="agent-type-select">
                {AGENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`agent-type-btn ${form.agentType === opt.id ? 'active' : ''}`}
                    onClick={() => set('agentType', opt.id as any)}
                    type="button"
                  >
                    <span className="agent-type-icon">{opt.icon}</span>
                    <span className="agent-type-label">{opt.label}</span>
                    <span className="agent-type-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Precio a cobrar (USD)</label>
              <div className="price-input-row">
                <span className="price-prefix">$</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', Number(e.target.value))}
                  min={100}
                  step={50}
                />
                <div className="price-hints">
                  {[500, 800, 1200, 1500].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`price-hint-btn ${form.price === p ? 'active' : ''}`}
                      onClick={() => set('price', p)}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn-primary btn-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar demo y mensajes'}
            </button>
          </div>
        </div>

        {/* RIGHT — outputs */}
        <div className="qualify-output-panel">
          {!result ? (
            <div className="qualify-empty">
              <div className="qualify-empty-icon">🎯</div>
              <p>Completa el formulario y genera automáticamente:</p>
              <ul>
                <li>Link de demo personalizada</li>
                <li>Mensaje de WhatsApp listo para copiar</li>
                <li>Texto de propuesta con precio</li>
                <li>Link de pago Stripe directo</li>
              </ul>
            </div>
          ) : (
            <div className="qualify-outputs">
              {/* Demo URL */}
              <div className="output-card">
                <div className="output-card-header">
                  <span className="output-card-icon">🔗</span>
                  <span className="output-card-title">Demo personalizada</span>
                  <CopyButton text={result.demoUrl} label="Copiar link" />
                </div>
                <a
                  href={result.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="demo-url-link"
                >
                  {result.demoUrl}
                </a>
                <p className="output-hint">
                  El agente ya está configurado con el contexto de {form.companyName}.
                </p>
              </div>

              {/* WhatsApp message */}
              <div className="output-card">
                <div className="output-card-header">
                  <span className="output-card-icon">💬</span>
                  <span className="output-card-title">Mensaje de WhatsApp</span>
                  <CopyButton text={result.whatsappMessage} label="Copiar mensaje" />
                </div>
                <pre className="output-text">{result.whatsappMessage}</pre>
              </div>

              {/* Proposal */}
              <div className="output-card">
                <div className="output-card-header">
                  <span className="output-card-icon">📋</span>
                  <span className="output-card-title">Propuesta + cierre</span>
                  <CopyButton text={result.proposalText} label="Copiar propuesta" />
                </div>
                <pre className="output-text">{result.proposalText}</pre>

                {!paymentUrl ? (
                  <button
                    className="btn-outline generate-payment-btn"
                    onClick={handleGeneratePayment}
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? 'Generando...' : 'Generar link de pago Stripe'}
                  </button>
                ) : (
                  <div className="payment-link-result">
                    <span className="payment-link-label">Link de pago listo:</span>
                    <a href={paymentUrl} target="_blank" rel="noreferrer" className="payment-link-url">
                      {paymentUrl}
                    </a>
                    <CopyButton text={paymentUrl} label="Copiar link" />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="output-summary">
                <div className="summary-row">
                  <span>Empresa</span><span>{form.companyName}</span>
                </div>
                <div className="summary-row">
                  <span>Agente</span>
                  <span>
                    {AGENT_OPTIONS.find((a) => a.id === form.agentType)?.label}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Precio</span><span className="summary-price">${form.price} USD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
