import { useState, useEffect } from 'react';

interface Attempt {
  id: string;
  sequence: number;
  channel: string;
  angle: string;
  subject?: string;
  message: string;
  sentAt?: string;
  outcome?: string;
}

interface Prospect {
  id: string;
  company: string;
  contactName: string;
  role?: string;
  email?: string;
  linkedin?: string;
  industry?: string;
  painPoints: string;
  context?: string;
  status: string;
  createdAt: string;
  attempts: Attempt[];
}

interface Stats {
  total: number;
  replied: number;
  converted: number;
  replyRate: number;
  bestAngles: { angle: string; rate: number }[];
}

function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
}

const ANGLE_LABELS: Record<string, string> = {
  pain: '🎯 Dolor',
  social_proof: '💬 Prueba social',
  value_add: '🎁 Valor gratis',
  urgency: '⏰ Urgencia',
  breakup: '👋 Cierre'
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Nuevo', color: '#6366f1' },
  SEQUENCE_GENERATED: { label: 'Secuencia lista', color: '#8b5cf6' },
  IN_PROGRESS: { label: 'En progreso', color: '#f59e0b' },
  REPLIED: { label: 'Respondió', color: '#10b981' },
  MEETING_BOOKED: { label: 'Reunión agendada', color: '#06b6d4' },
  CONVERTED: { label: 'Cliente', color: '#22c55e' },
  DEAD: { label: 'Sin interés', color: '#ef4444' }
};

export function ProspectsTab() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      authFetch('/api/prospecting/prospects'),
      authFetch('/api/prospecting/stats')
    ]);
    if (pRes.ok) {
      const data = await pRes.json();
      setProspects(data);
      if (selected) {
        const refreshed = data.find((p: Prospect) => p.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    }
    if (sRes.ok) setStats(await sRes.json());
    setLoading(false);
  };

  const generate = async (id: string) => {
    setGenerating(id);
    const res = await authFetch(`/api/prospecting/prospects/${id}/generate`, { method: 'POST' });
    if (res.ok) await loadAll();
    setGenerating(null);
  };

  const markSent = async (attemptId: string) => {
    await authFetch(`/api/prospecting/attempts/${attemptId}/sent`, { method: 'POST' });
    await loadAll();
  };

  const markOutcome = async (attemptId: string, outcome: string) => {
    await authFetch(`/api/prospecting/attempts/${attemptId}/outcome`, {
      method: 'POST',
      body: JSON.stringify({ outcome })
    });
    await loadAll();
  };

  const deleteProspect = async (id: string) => {
    await authFetch(`/api/prospecting/prospects/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    await loadAll();
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="empty-state">Cargando prospectos...</div>;

  return (
    <div className="prospects-layout">
      {/* Panel izquierdo: lista + stats */}
      <div className="prospects-sidebar">
        {/* Stats rápidas */}
        {stats && (
          <div className="prospect-stats-row">
            <div className="pstat">
              <span className="pstat-val">{stats.total}</span>
              <span className="pstat-label">Total</span>
            </div>
            <div className="pstat">
              <span className="pstat-val">{stats.replied}</span>
              <span className="pstat-label">Respuestas</span>
            </div>
            <div className="pstat">
              <span className="pstat-val">{stats.replyRate}%</span>
              <span className="pstat-label">Tasa respuesta</span>
            </div>
            <div className="pstat">
              <span className="pstat-val">{stats.converted}</span>
              <span className="pstat-label">Clientes</span>
            </div>
          </div>
        )}

        {/* Ángulos que mejor funcionan */}
        {stats && stats.bestAngles.length > 0 && (
          <div className="best-angles">
            <p className="best-angles-title">Ángulos más efectivos</p>
            {stats.bestAngles.slice(0, 3).map((a) => (
              <div key={a.angle} className="best-angle-row">
                <span>{ANGLE_LABELS[a.angle] ?? a.angle}</span>
                <span className="best-angle-rate">{a.rate}%</span>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary btn-full" onClick={() => setShowForm(true)}>
          + Nuevo prospecto
        </button>

        {/* Lista */}
        <div className="prospect-list">
          {prospects.length === 0 && (
            <div className="empty-state-sm">
              Agrega tu primer prospecto para que el agente genere la secuencia.
            </div>
          )}
          {prospects.map((p) => {
            const st = STATUS_LABELS[p.status] ?? { label: p.status, color: '#888' };
            return (
              <button
                key={p.id}
                className={`prospect-item ${selected?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelected(p)}
              >
                <div className="prospect-item-top">
                  <span className="prospect-company">{p.company}</span>
                  <span className="prospect-status-dot" style={{ background: st.color }} title={st.label} />
                </div>
                <div className="prospect-item-sub">
                  {p.contactName} · {p.attempts.length} mensajes
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel derecho: detalle del prospecto seleccionado */}
      {selected ? (
        <div className="prospect-detail">
          <div className="prospect-detail-header">
            <div>
              <h2>{selected.company}</h2>
              <p className="prospect-detail-sub">
                {selected.contactName}
                {selected.role ? ` · ${selected.role}` : ''}
                {selected.industry ? ` · ${selected.industry}` : ''}
              </p>
              <p className="prospect-pain">{selected.painPoints}</p>
            </div>
            <div className="prospect-detail-actions">
              <button
                className="btn-primary"
                onClick={() => generate(selected.id)}
                disabled={generating === selected.id}
              >
                {generating === selected.id
                  ? 'Generando...'
                  : selected.attempts.length > 0
                  ? '↺ Regenerar'
                  : '✨ Generar secuencia'}
              </button>
              <button className="btn-outline btn-danger" onClick={() => deleteProspect(selected.id)}>
                Eliminar
              </button>
            </div>
          </div>

          {generating === selected.id && (
            <div className="generating-banner">
              El agente está redactando los 5 mensajes personalizados basándose en el dolor del
              prospecto y en los mensajes que han funcionado antes...
            </div>
          )}

          {selected.attempts.length === 0 && generating !== selected.id && (
            <div className="empty-state-sm">
              Haz clic en "Generar secuencia" para que el agente cree los 5 mensajes.
            </div>
          )}

          {/* Secuencia de mensajes */}
          <div className="sequence-list">
            {selected.attempts.map((attempt) => (
              <div
                key={attempt.id}
                className={`sequence-card ${attempt.outcome ? `outcome-${attempt.outcome.toLowerCase()}` : ''}`}
              >
                <div className="sequence-card-header">
                  <div className="sequence-meta">
                    <span className="seq-num">#{attempt.sequence}</span>
                    <span className="seq-angle">{ANGLE_LABELS[attempt.angle] ?? attempt.angle}</span>
                    <span className="seq-channel">{attempt.channel === 'email' ? '📧' : '💼'} {attempt.channel}</span>
                    {attempt.sentAt && <span className="seq-sent">Enviado</span>}
                  </div>
                  <div className="sequence-card-actions">
                    <button
                      className="copy-btn"
                      onClick={() => copyMessage(attempt.id, attempt.message)}
                    >
                      {copied === attempt.id ? '✓ Copiado' : 'Copiar'}
                    </button>
                    {!attempt.sentAt && (
                      <button className="sent-btn" onClick={() => markSent(attempt.id)}>
                        Marcar enviado
                      </button>
                    )}
                  </div>
                </div>

                {attempt.subject && (
                  <div className="seq-subject">Asunto: {attempt.subject}</div>
                )}

                <div className="seq-message">{attempt.message}</div>

                {/* Feedback: solo si fue enviado y no tiene resultado */}
                {attempt.sentAt && !attempt.outcome && (
                  <div className="outcome-buttons">
                    <span className="outcome-label">¿Qué pasó?</span>
                    {(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_REPLY'] as const).map((o) => (
                      <button
                        key={o}
                        className={`outcome-btn outcome-btn-${o.toLowerCase()}`}
                        onClick={() => markOutcome(attempt.id, o)}
                      >
                        {o === 'POSITIVE' ? '✅ Respondió positivo'
                          : o === 'NEUTRAL' ? '🤷 Respondió neutral'
                          : o === 'NEGATIVE' ? '❌ No interesa'
                          : '📭 Sin respuesta'}
                      </button>
                    ))}
                  </div>
                )}

                {attempt.outcome && (
                  <div className={`outcome-badge outcome-badge-${attempt.outcome.toLowerCase()}`}>
                    {attempt.outcome === 'POSITIVE' ? '✅ Respondió positivo'
                      : attempt.outcome === 'NEUTRAL' ? '🤷 Respondió neutral'
                      : attempt.outcome === 'NEGATIVE' ? '❌ No interesa'
                      : '📭 Sin respuesta'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="prospect-detail prospect-detail-empty">
          <p>Selecciona un prospecto para ver su secuencia</p>
        </div>
      )}

      {/* Modal: nuevo prospecto */}
      {showForm && (
        <NewProspectModal
          onClose={() => setShowForm(false)}
          onCreated={async (id) => {
            setShowForm(false);
            await loadAll();
            // Auto-seleccionar y generar
            const res = await authFetch('/api/prospecting/prospects');
            if (res.ok) {
              const data = await res.json();
              const np = data.find((p: Prospect) => p.id === id);
              if (np) setSelected(np);
            }
          }}
        />
      )}
    </div>
  );
}

function NewProspectModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState({
    company: '',
    contactName: '',
    role: '',
    email: '',
    linkedin: '',
    industry: '',
    painPoints: '',
    context: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.painPoints.trim()) {
      setError('El dolor principal es obligatorio — es lo que personaliza toda la secuencia');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/prospecting/prospects', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Error al crear prospecto');
      const data = await res.json();
      onCreated(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo prospecto</h2>
        <p className="modal-subtitle">
          Cuanto más detallado sea el dolor, mejor personaliza el agente los mensajes.
        </p>
        <form onSubmit={submit} className="auth-form">
          <div className="form-row">
            <div className="field">
              <label>Empresa *</label>
              <input value={form.company} onChange={set('company')} placeholder="Acme Corp" required />
            </div>
            <div className="field">
              <label>Nombre del contacto *</label>
              <input value={form.contactName} onChange={set('contactName')} placeholder="María García" required />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Cargo</label>
              <input value={form.role} onChange={set('role')} placeholder="Operations Manager" />
            </div>
            <div className="field">
              <label>Industria</label>
              <input value={form.industry} onChange={set('industry')} placeholder="E-commerce, Retail, SaaS..." />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="maria@acme.com" />
            </div>
            <div className="field">
              <label>LinkedIn URL</label>
              <input value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/..." />
            </div>
          </div>
          <div className="field">
            <label>
              Dolor principal *{' '}
              <span className="field-hint">
                Descríbelo como lo diría el cliente, no como tecnología
              </span>
            </label>
            <textarea
              value={form.painPoints}
              onChange={set('painPoints')}
              placeholder='Ej: "Su equipo de soporte tarda 2 días en responder tickets y los clientes se van a la competencia" o "Tienen 3 personas dedicadas a generar reportes manuales cada lunes"'
              rows={3}
              required
            />
          </div>
          <div className="field">
            <label>
              Contexto adicional{' '}
              <span className="field-hint">Tamaño, herramientas, intentos anteriores...</span>
            </label>
            <textarea
              value={form.context}
              onChange={set('context')}
              placeholder="Empresa de 30 personas. Usan Zendesk. Ya intentaron chatbots básicos sin éxito."
              rows={2}
            />
          </div>
          {error && <div className="error-box">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear y generar secuencia →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
