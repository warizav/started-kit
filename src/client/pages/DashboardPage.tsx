import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
  plan: string;
}

interface Stats {
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  tokensUsed: number;
  activeAgents: number;
}

interface AgentConfig {
  id: string;
  name: string;
  agentType: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
}

interface Execution {
  id: string;
  agentType: string;
  tokensUsed: number;
  latencyMs: number;
  successful: boolean;
  createdAt: string;
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

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'executions'>('overview');
  const [loading, setLoading] = useState(true);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [successBanner, setSuccessBanner] = useState(searchParams.get('success') === '1');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, statsRes, configsRes, exRes] = await Promise.all([
        authFetch('/api/auth/me'),
        authFetch('/api/clients/stats'),
        authFetch('/api/clients/configs'),
        authFetch('/api/clients/executions')
      ]);

      if (userRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setUser(await userRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (configsRes.ok) setConfigs(await configsRes.json());
      if (exRes.ok) setExecutions(await exRes.json());
    } catch {
      // silently fail; network error
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const manageSubscription = async () => {
    const res = await authFetch('/api/payments/create-portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-logo">AgentOS</Link>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'overview' ? 'sidebar-item active' : 'sidebar-item'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'agents' ? 'sidebar-item active' : 'sidebar-item'}
            onClick={() => setActiveTab('agents')}
          >
            My Agents
          </button>
          <button
            className={activeTab === 'executions' ? 'sidebar-item active' : 'sidebar-item'}
            onClick={() => setActiveTab('executions')}
          >
            Executions
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-plan">
            <span className="plan-badge">{user?.plan ?? 'FREE'}</span>
            {user?.plan === 'FREE' && (
              <Link to="/pricing" className="upgrade-link">Upgrade →</Link>
            )}
          </div>
          <button onClick={manageSubscription} className="sidebar-manage">Manage billing</button>
          <button onClick={logout} className="sidebar-logout">Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{activeTab === 'overview' ? 'Overview' : activeTab === 'agents' ? 'My Agents' : 'Executions'}</h1>
            <p className="dashboard-user">
              {user?.name ?? user?.email} · {user?.plan} plan
            </p>
          </div>
          {activeTab === 'agents' && (
            <button className="btn-primary" onClick={() => setShowNewAgent(true)}>
              + New Agent
            </button>
          )}
        </header>

        {successBanner && (
          <div className="success-banner">
            Payment successful! Your plan has been upgraded.{' '}
            <button onClick={() => setSuccessBanner(false)}>✕</button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">Total Executions</span>
                <span className="stat-value">{stats?.totalExecutions ?? 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">{stats?.successRate ?? 0}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Tokens Used</span>
                <span className="stat-value">{(stats?.tokensUsed ?? 0).toLocaleString()}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Agents</span>
                <span className="stat-value">{stats?.activeAgents ?? 0}</span>
              </div>
            </div>

            <div className="overview-ctas">
              <div className="overview-cta-card">
                <h3>Try the live demo</h3>
                <p>See your agents in action before configuring them for your workflow.</p>
                <Link to="/demo" className="btn-outline">Open Demo →</Link>
              </div>
              {user?.plan === 'FREE' && (
                <div className="overview-cta-card highlight">
                  <h3>Upgrade your plan</h3>
                  <p>Unlock unlimited executions, custom agent configs, and priority support.</p>
                  <Link to="/pricing" className="btn-primary">See Plans →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="agents-tab">
            {configs.length === 0 ? (
              <div className="empty-state">
                <h3>No agents configured yet</h3>
                <p>Create your first agent to start automating your workflows.</p>
                <button className="btn-primary" onClick={() => setShowNewAgent(true)}>
                  Create your first agent
                </button>
              </div>
            ) : (
              <div className="agent-config-list">
                {configs.map((cfg) => (
                  <div key={cfg.id} className="agent-config-card">
                    <div className="config-info">
                      <h4>{cfg.name}</h4>
                      <span className="config-type">{cfg.agentType}</span>
                    </div>
                    <div className="config-status">
                      <span className={cfg.isActive ? 'badge-active' : 'badge-inactive'}>
                        {cfg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Executions Tab */}
        {activeTab === 'executions' && (
          <div className="executions-tab">
            {executions.length === 0 ? (
              <div className="empty-state">
                <h3>No executions yet</h3>
                <p>Run an agent from the demo page to see executions appear here.</p>
                <Link to="/demo" className="btn-outline">Try Demo →</Link>
              </div>
            ) : (
              <table className="executions-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Tokens</th>
                    <th>Latency</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((ex) => (
                    <tr key={ex.id}>
                      <td>{ex.agentType}</td>
                      <td>{ex.tokensUsed}</td>
                      <td>{ex.latencyMs}ms</td>
                      <td>
                        <span className={ex.successful ? 'badge-active' : 'badge-inactive'}>
                          {ex.successful ? 'OK' : 'Failed'}
                        </span>
                      </td>
                      <td>{new Date(ex.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* New Agent Modal */}
      {showNewAgent && (
        <NewAgentModal
          onClose={() => setShowNewAgent(false)}
          onCreated={() => {
            setShowNewAgent(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function NewAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState('support');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/clients/configs', {
        method: 'POST',
        body: JSON.stringify({ name, agentType, systemPrompt })
      });
      if (!res.ok) throw new Error('Failed to create agent');
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Create new agent</h2>
        <form onSubmit={create} className="auth-form">
          <div className="field">
            <label>Agent name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              required
            />
          </div>
          <div className="field">
            <label>Agent type</label>
            <select value={agentType} onChange={(e) => setAgentType(e.target.value)}>
              <option value="support">Customer Support</option>
              <option value="analytics">Data Analytics</option>
              <option value="content">Content Writer</option>
            </select>
          </div>
          <div className="field">
            <label>System prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe how this agent should behave..."
              rows={4}
              required
            />
          </div>
          {error && <div className="error-box">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
