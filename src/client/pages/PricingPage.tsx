import { useState } from 'react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'content',
    name: 'Content Writer',
    icon: '✍️',
    price: 299,
    description: 'Generate on-brand marketing content at scale',
    features: [
      'Unlimited content generations',
      'Brand voice customization',
      'Blog posts, emails, social copy',
      'Slack + email delivery',
      'API access'
    ],
    cta: 'Start Content Agent',
    highlight: false
  },
  {
    id: 'support',
    name: 'Customer Support',
    icon: '🎧',
    price: 499,
    description: 'Resolve customer inquiries automatically, 24/7',
    features: [
      'Unlimited support responses',
      'Custom knowledge base',
      'Zendesk / email integration',
      'Escalation rules',
      'Analytics dashboard'
    ],
    cta: 'Start Support Agent',
    highlight: true
  },
  {
    id: 'analytics',
    name: 'Data Analytics',
    icon: '📊',
    price: 999,
    description: 'Transform raw data into actionable business insights',
    features: [
      'Unlimited data analyses',
      'CSV / Excel ingestion',
      'Automated weekly reports',
      'Slack / email delivery',
      'Custom metrics tracking'
    ],
    cta: 'Start Analytics Agent',
    highlight: false
  },
  {
    id: 'bundle',
    name: 'All 3 Agents',
    icon: '⚡',
    price: 1499,
    description: 'Full AI workforce for your business operations',
    features: [
      'Everything in all 3 plans',
      'Priority support (2h SLA)',
      'Custom agent fine-tuning',
      'Dedicated success manager',
      'White-label option available'
    ],
    cta: 'Get Full Bundle',
    highlight: false,
    badge: 'Best value — save $298/mo'
  }
];

interface RoiState {
  hours: number;
  people: number;
  rate: number;
}

export function PricingPage() {
  const [roi, setRoi] = useState<RoiState>({ hours: 20, people: 2, rate: 25 });

  const monthlyCost = roi.hours * 4 * roi.people * roi.rate;
  const monthlySaving = Math.round(monthlyCost * 0.7);
  const paybackDays = (499 / (monthlySaving / 30)).toFixed(0);

  return (
    <div className="page pricing-page">
      <nav className="page-nav">
        <Link to="/" className="nav-logo">AgentOS</Link>
        <div className="nav-links">
          <Link to="/demo">Live Demo</Link>
          <Link to="/contact" className="nav-cta">Get a demo</Link>
        </div>
      </nav>

      <div className="pricing-header">
        <h1>Simple pricing. Real ROI.</h1>
        <p>Every plan pays for itself. Calculate yours below.</p>
      </div>

      {/* ROI Calculator */}
      <div className="roi-calculator">
        <h3>Your ROI Calculator</h3>
        <div className="roi-inputs">
          <div className="roi-field">
            <label>Hours/week spent on manual work</label>
            <input
              type="range"
              min={5}
              max={80}
              value={roi.hours}
              onChange={(e) => setRoi((s) => ({ ...s, hours: +e.target.value }))}
            />
            <span>{roi.hours}h/week</span>
          </div>
          <div className="roi-field">
            <label>Team members doing this work</label>
            <input
              type="range"
              min={1}
              max={20}
              value={roi.people}
              onChange={(e) => setRoi((s) => ({ ...s, people: +e.target.value }))}
            />
            <span>{roi.people} people</span>
          </div>
          <div className="roi-field">
            <label>Average hourly cost (salary + overhead)</label>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={roi.rate}
              onChange={(e) => setRoi((s) => ({ ...s, rate: +e.target.value }))}
            />
            <span>${roi.rate}/hour</span>
          </div>
        </div>
        <div className="roi-results">
          <div className="roi-stat">
            <span className="roi-label">Current monthly cost</span>
            <span className="roi-value roi-bad">${monthlyCost.toLocaleString()}</span>
          </div>
          <div className="roi-arrow">→</div>
          <div className="roi-stat">
            <span className="roi-label">Monthly savings with agent</span>
            <span className="roi-value roi-good">+${monthlySaving.toLocaleString()}</span>
          </div>
          <div className="roi-arrow">→</div>
          <div className="roi-stat">
            <span className="roi-label">Payback period</span>
            <span className="roi-value roi-accent">{paybackDays} days</span>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.highlight ? 'pricing-highlight' : ''}`}>
            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
            <div className="plan-header">
              <span className="plan-icon">{plan.icon}</span>
              <h3>{plan.name}</h3>
              <p className="plan-desc">{plan.description}</p>
            </div>
            <div className="plan-price">
              <span className="price-amount">${plan.price}</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <span className="check">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              to={`/contact?agent=${plan.id}`}
              className={plan.highlight ? 'btn-primary btn-full' : 'btn-outline btn-full'}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Social proof / objection handling */}
      <div className="pricing-faq">
        <h2>Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How fast can we go live?</h4>
            <p>48 hours from payment. We configure your agent, connect to your tools, and hand you a working system — not a tutorial.</p>
          </div>
          <div className="faq-item">
            <h4>Do I need technical skills?</h4>
            <p>No. We handle the setup. You provide context about your business and we do the rest. Your team uses it through Slack or a simple web interface.</p>
          </div>
          <div className="faq-item">
            <h4>What if it does not work for my use case?</h4>
            <p>We pilot for 7 days before charging. If the agent does not solve your problem, you pay nothing.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Yes. Monthly subscriptions, no annual contracts required. We earn your business every month.</p>
          </div>
        </div>
      </div>

      <div className="pricing-cta">
        <h2>Not sure which plan fits?</h2>
        <p>Tell us your problem. We will tell you the exact agent and the exact ROI — in a 15-minute call.</p>
        <Link to="/contact" className="btn-primary">Book a free 15-min call →</Link>
      </div>
    </div>
  );
}
