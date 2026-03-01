import { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function AuthPage({ mode }) {
    const { role } = useParams();
    const actualRole = role || window.location.pathname.split('/')[1];
    const isLogin = mode === 'login';
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const routes = { candidate: '/candidate/jobs', recruiter: '/recruiter/jobs', admin: '/admin/dashboard' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const user = await login(form.email, form.password);
                showToast('Welcome back!');
                navigate(routes[user.role] || '/entry');
            } else {
                const user = await signup(form.name, form.email, form.password, actualRole);
                showToast('Account created!');
                navigate(routes[user.role] || '/entry');
            }
        } catch (err) {
            showToast(err.response?.data?.detail || 'Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'var(--bg-primary)',
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 18,
                    }}>AI</div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, textTransform: 'capitalize' }}>
                        {isLogin ? `Sign in as ${actualRole}` : `Sign up as ${actualRole}`}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {!isLogin && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input
                                className="input"
                                placeholder="Enter your name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: 8, width: '100%', padding: '12px 20px' }}
                    >
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    {isLogin ? (
                        <>Don't have an account?{' '}
                            <Link to={`/${actualRole}/signup`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
                        </>
                    ) : (
                        <>Already have an account?{' '}
                            <Link to={`/${actualRole}/login`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
                        </>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to="/entry" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
                </div>
            </div>
        </div>
    );
}
