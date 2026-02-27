import { useState } from 'react';
import useAuthStore from './store';
import './App.css';

type View = 'landing' | 'login' | 'register' | 'dashboard';

function PricingCard({
  name,
  price,
  features,
  cta,
  highlight,
  onSelect,
}: {
  name: string;
  price: number | string;
  features: string[];
  cta: string;
  highlight?: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`pricing-card ${highlight ? 'pricing-card--highlight' : ''}`}>
      <h3>{name}</h3>
      <div className="pricing-price">
        {typeof price === 'number' ? (
          <>
            <span className="pricing-amount">${price}</span>
            <span className="pricing-period">/mo</span>
          </>
        ) : (
          <span className="pricing-amount">{price}</span>
        )}
      </div>
      <ul className="pricing-features">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button className={`btn ${highlight ? 'btn-primary' : 'btn-secondary'}`} onClick={onSelect}>
        {cta}
      </button>
    </div>
  );
}

function AuthForm({ mode, onSwitch }: { mode: 'login' | 'register'; onSwitch: () => void }) {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register') {
      await register(email, password, name);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="auth-container">
      <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={clearError} className="error-close">x</button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Start Free'}
        </button>
      </form>
      <p className="auth-switch">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button className="link-btn" onClick={onSwitch}>
          {mode === 'login' ? 'Sign up free' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}

function Dashboard() {
  const { user, logout, token } = useAuthStore();
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const callApi = async () => {
    setApiLoading(true);
    const res = await fetch('/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setApiResult(data);
    setApiLoading(false);
  };

  const upgradePlan = async (plan: 'pro' | 'business') => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        plan,
        successUrl: window.location.origin + '/?upgraded=1',
        cancelUrl: window.location.origin + '/',
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <span className="dashboard-brand">willycode</span>
        <div className="dashboard-user">
          <span className="plan-badge">{user?.plan?.toUpperCase()}</span>
          <span>{user?.name}</span>
          <button className="btn btn-ghost" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Current Plan</div>
            <div className="stat-value">{user?.plan}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">API Calls This Month</div>
            <div className="stat-value">{user?.apiCallsThisMonth ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Monthly Limit</div>
            <div className="stat-value">
              {user?.plan === 'free' ? '100' : user?.plan === 'pro' ? '10,000' : 'Unlimited'}
            </div>
          </div>
        </div>

        <div className="api-demo">
          <h2>API Demo</h2>
          <button className="btn btn-primary" onClick={callApi} disabled={apiLoading}>
            {apiLoading ? 'Calling...' : 'Make API Call'}
          </button>
          {apiResult && (
            <pre className="api-result">{JSON.stringify(apiResult, null, 2)}</pre>
          )}
        </div>

        {user?.plan === 'free' && (
          <div className="upgrade-banner">
            <h3>Unlock More Power</h3>
            <p>You are on the Free plan. Upgrade to remove limits and get priority support.</p>
            <div className="upgrade-actions">
              <button className="btn btn-secondary" onClick={() => upgradePlan('pro')}>
                Upgrade to Pro - $29/mo
              </button>
              <button className="btn btn-primary" onClick={() => upgradePlan('business')}>
                Upgrade to Business - $99/mo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Landing({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="brand">willycode</span>
        <nav>
          <a href="#pricing">Pricing</a>
          <button className="btn btn-ghost" onClick={onLogin}>Sign In</button>
          <button className="btn btn-primary" onClick={onRegister}>Get Started Free</button>
        </nav>
      </header>

      <section className="hero">
        <h1>Build and Ship Faster.<br />Scale to $10M.</h1>
        <p>The full-stack API platform that grows with your business. Start free, scale seamlessly.</p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={onRegister}>
            Start Free - No Credit Card
          </button>
          <a href="#pricing" className="btn btn-ghost btn-lg">See Pricing</a>
        </div>
        <div className="hero-social-proof">
          <span>100 free API calls/month</span>
          <span>No setup required</span>
          <span>Cancel anytime</span>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <h2>Simple, Transparent Pricing</h2>
        <p>Start free. Upgrade when you are ready.</p>
        <div className="pricing-grid">
          <PricingCard
            name="Free"
            price={0}
            features={['100 API calls/month', 'Community support', 'Basic analytics']}
            cta="Start Free"
            onSelect={onRegister}
          />
          <PricingCard
            name="Pro"
            price={29}
            features={['10,000 API calls/month', 'Email support', 'Advanced analytics', 'Webhooks']}
            cta="Get Pro"
            highlight
            onSelect={onRegister}
          />
          <PricingCard
            name="Business"
            price={99}
            features={['Unlimited API calls', 'Priority support', 'SLA guarantee', 'Custom integrations', 'Dedicated onboarding']}
            cta="Contact Sales"
            onSelect={onRegister}
          />
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const { token } = useAuthStore();
  const [view, setView] = useState<View>('landing');

  if (token) return <Dashboard />;

  if (view === 'login')
    return <AuthForm mode="login" onSwitch={() => setView('register')} />;

  if (view === 'register')
    return <AuthForm mode="register" onSwitch={() => setView('login')} />;

  return <Landing onLogin={() => setView('login')} onRegister={() => setView('register')} />;
}
