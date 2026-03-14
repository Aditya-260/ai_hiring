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
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', confirmPassword: '', countryCode: '+91' });
    const [loading, setLoading] = useState(false);

    const routes = { candidate: '/candidate/jobs', recruiter: '/recruiter/company' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const user = await login(form.email, form.password);
                showToast('Welcome back!');
                navigate(routes[user.role] || '/entry');
            } else {
                if (form.password !== form.confirmPassword) {
                    showToast('Passwords do not match', 'error');
                    setLoading(false);
                    return;
                }
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
                if (!passwordRegex.test(form.password)) {
                    showToast('Password must be at least 8 chars with uppercase, lowercase, number, and special char', 'error');
                    setLoading(false);
                    return;
                }
                const fullPhone = form.countryCode + form.phone;
                const user = await signup(form.firstName, form.lastName, form.email, form.password, fullPhone, actualRole);
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
                        <>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>First Name</label>
                                    <input
                                        className="input"
                                        placeholder="First name"
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Last Name</label>
                                    <input
                                        className="input"
                                        placeholder="Last name"
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Phone Number</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select 
                                        className="input" 
                                        style={{ width: '100px', padding: '0 8px' }}
                                        value={form.countryCode}
                                        onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+1">+1 (US/CA)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+61">+61 (AU)</option>
                                        <option value="+81">+81 (JP)</option>
                                        <option value="+86">+86 (CN)</option>
                                    </select>
                                    <input
                                        className="input"
                                        style={{ flex: 1 }}
                                        type="tel"
                                        pattern="\d{10}"
                                        maxLength={10}
                                        title="Needs to be exactly 10 digits"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
                            {isLogin ? 'Email or Phone Number' : 'Email'}
                        </label>
                        <input
                            className="input"
                            type={isLogin ? "text" : "email"}
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
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={8}
                        />
                        {!isLogin && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Must be at least 8 chars with uppercase, lowercase, number & special char.</p>}
                    </div>
                    {!isLogin && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>Confirm Password</label>
                            <input
                                className="input"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                required
                                minLength={8}
                            />
                        </div>
                    )}
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
