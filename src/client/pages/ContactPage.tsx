import { useState } from 'react';
import { Link } from 'react-router-dom';

type AgentType = 'support' | 'analytics' | 'content' | 'bundle';
type TeamSize = '1' | '2_10' | '11_50' | 'over_50';
type Budget = 'under_200' | '200_500' | '500_1000' | 'over_1000';
type Urgency = 'this_week' | 'this_month' | 'exploring';

interface FormState {
  name: string;
  email: string;
  company: string;
  role: string;
  problem: string;
  agentType: AgentType;
  teamSize: TeamSize;
  budget: Budget;
  urgency: Urgency;
}

export function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    role: '',
    problem: '',
    agentType: 'support',
    teamSize: '2_10',
    budget: '500_1000',
    urgency: 'this_month'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ tier: string; nextStep: string } | null>(null);
  const [error, setError] = useState('');

  const set = (key: keyof FormState) => (e: any) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.problem) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();
      setSubmitted({ tier: data.tier, nextStep: data.nextStep });
    } catch {
      setError('Something went wrong. Please email us directly.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page contact-page">
        <nav className="page-nav">
          <Link to="/" className="nav-logo">AgentOS</Link>
          <div className="nav-links">
            <Link to="/pricing">Pricing</Link>
            <Link to="/demo">Live Demo</Link>
          </div>
        </nav>
        <div className="success-screen">
          <div className="success-icon">{submitted.tier === 'hot' ? '🔥' : '✅'}</div>
          <h1>You are on the list{submitted.tier === 'hot' ? ' — and you are HOT' : ''}.</h1>
          <p>{submitted.nextStep}</p>
          <div className="success-actions">
            <Link to="/demo" className="btn-primary">Try the live demo while you wait</Link>
            <Link to="/" className="btn-ghost">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page contact-page">
      <nav className="page-nav">
        <Link to="/" className="nav-logo">AgentOS</Link>
        <div className="nav-links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/demo">Live Demo</Link>
        </div>
      </nav>

      <div className="contact-container">
        <div className="contact-left">
          <h1>Let's talk about your business.</h1>
          <p>
            Tell us what slows your team down. We will show you the exact agent that fixes it —
            deployed in 48 hours.
          </p>
          <ul className="contact-promises">
            <li>Response within 2 hours (business days)</li>
            <li>Personalized demo for your specific workflow</li>
            <li>Clear ROI estimate before any commitment</li>
            <li>No lock-in — cancel anytime</li>
          </ul>
        </div>

        <form className="contact-form" onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>Your name *</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="field">
              <label>Work email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@company.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Company *</label>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="Acme Inc."
                required
              />
            </div>
            <div className="field">
              <label>Your role</label>
              <input
                type="text"
                value={form.role}
                onChange={set('role')}
                placeholder="Head of Operations"
              />
            </div>
          </div>

          <div className="field">
            <label>What problem are you trying to solve? *</label>
            <textarea
              value={form.problem}
              onChange={set('problem')}
              placeholder="e.g. Our support team spends 6 hours/day answering the same questions. We need to automate this."
              rows={3}
              required
            />
          </div>

          <div className="field">
            <label>Which agent fits your need best?</label>
            <div className="radio-group">
              {[
                { id: 'support', label: '🎧 Customer Support — $499/mo' },
                { id: 'analytics', label: '📊 Data Analytics — $999/mo' },
                { id: 'content', label: '✍️ Content Writer — $299/mo' },
                { id: 'bundle', label: '⚡ All 3 Agents — $1,499/mo' }
              ].map((opt) => (
                <label key={opt.id} className={`radio-option ${form.agentType === opt.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="agentType"
                    value={opt.id}
                    checked={form.agentType === opt.id as AgentType}
                    onChange={set('agentType')}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Team size</label>
              <select value={form.teamSize} onChange={set('teamSize')}>
                <option value="1">Just me</option>
                <option value="2_10">2–10 people</option>
                <option value="11_50">11–50 people</option>
                <option value="over_50">50+ people</option>
              </select>
            </div>

            <div className="field">
              <label>Monthly budget</label>
              <select value={form.budget} onChange={set('budget')}>
                <option value="under_200">Under $200</option>
                <option value="200_500">$200–$500</option>
                <option value="500_1000">$500–$1,000</option>
                <option value="over_1000">$1,000+</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>When do you need this?</label>
            <div className="urgency-group">
              {[
                { id: 'this_week', label: 'This week 🔥' },
                { id: 'this_month', label: 'This month' },
                { id: 'exploring', label: 'Just exploring' }
              ].map((opt) => (
                <label key={opt.id} className={`urgency-option ${form.urgency === opt.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.id}
                    checked={form.urgency === opt.id as Urgency}
                    onChange={set('urgency')}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending...' : 'Get my personalized demo →'}
          </button>

          <p className="form-fine-print">No spam. No sales scripts. Just a real demo for your real problem.</p>
        </form>
      </div>
    </div>
  );
}
