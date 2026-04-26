import { useState, useEffect } from 'react';
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
    
    const [form, setForm] = useState({ 
        firstName: '', lastName: '', email: '', password: '', 
        phone: '', confirmPassword: '', countryCode: '+91' 
    });
    const [loading, setLoading] = useState(false);

    const routes = { candidate: '/candidate/jobs', recruiter: '/recruiter/company' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const user = await login(form.email, form.password);
                showToast('Welcome back!', 'success');
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
                showToast('Account created!', 'success');
                navigate(routes[user.role] || '/entry');
            }
        } catch (err) {
            showToast(err.response?.data?.detail || 'Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Role-specific copy
    const copy = {
        candidate: {
            title: "Accelerate your career journey.",
            subtitle: "Join thousands of candidates showcasing their skills through AI-powered, fair assessments. Get hired for what you can do, not just what's on your resume.",
            gradient: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
            features: [
                "Skill-based matching",
                "Instant assessment feedback",
                "Direct connection to top companies"
            ]
        },
        recruiter: {
            title: "Hire the top 1% faster.",
            subtitle: "Automate your screening process with intelligent proctoring and comprehensive AI assessments. Make data-driven decisions that build exceptional teams.",
            gradient: "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)",
            features: [
                "Automated AI screening",
                "Advanced tab & face proctoring",
                "Actionable candidate insights"
            ]
        }
    };

    const currentCopy = copy[actualRole] || copy.candidate;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }} className="animate-fade-in">
            
            {/* Left Side - Visual / Branding */}
            <div style={{
                flex: 1,
                display: 'flex', // Removed inline '@media' and 'display: none'
                background: currentCopy.gradient,
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '64px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }} className="auth-left-panel">
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%', 
                    width: '60%', height: '60%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}/>
                <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%', 
                    width: '80%', height: '80%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}/>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Link to="/entry" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, width: 'fit-content' }}>
                        <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                        <h2 style={{ 
                            fontSize: 32, 
                            fontWeight: 800, 
                            color: 'white', 
                            marginBottom: 16,
                            letterSpacing: '-0.5px'
                        }}>
                            Beyond-Hiring
                        </h2>
                    </Link>
                </div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: 'auto 0' }}>
                    <div style={{ 
                        display: 'inline-block', marginBottom: 24, padding: '6px 16px', 
                        borderRadius: 20, background: 'rgba(255,255,255,0.1)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                    }}>
                        For {actualRole}s
                    </div>
                    <h1 style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24 }}>
                        {currentCopy.title}
                    </h1>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 48 }}>
                        {currentCopy.subtitle}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {currentCopy.features.map((feature, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                    width: 24, height: 24, borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.2)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12
                                }}>✓</div>
                                <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                position: 'relative',
                background: 'var(--bg-secondary)'
            }}>
                <div className="animate-slide-up glass" style={{ 
                    width: '100%', 
                    maxWidth: 480, 
                    padding: '48px 40px', 
                    borderRadius: '24px', 
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 36 }}>
                        <div className="mobile-branding" style={{ display: 'none' }}>
                            <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 16px', display: 'block', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 8 }}>
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                            {isLogin ? `Sign in to your ${actualRole} account` : `Join as a ${actualRole} today`}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {!isLogin && (
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>First Name</label>
                                    <input
                                        className="input"
                                        style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                        placeholder="John"
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>Last Name</label>
                                    <input
                                        className="input"
                                        style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                        placeholder="Doe"
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        {!isLogin && (
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>Phone Number</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <select 
                                        className="input" 
                                        style={{ width: '110px', padding: '14px 12px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                        value={form.countryCode}
                                        onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                                    >
                                        <option value="+91">+91 (IN)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+61">+61 (AU)</option>
                                    </select>
                                    <input
                                        className="input"
                                        style={{ flex: 1, padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                        type="tel"
                                        placeholder="Enter your phone"
                                        pattern="\d{10}"
                                        maxLength={10}
                                        title="Needs to be exactly 10 digits"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                {isLogin ? 'Email or Phone Number' : (actualRole === 'candidate' ? 'Email Address' : 'Work Email')}
                            </label>
                            <input
                                className="input"
                                style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                type={isLogin ? "text" : "email"}
                                placeholder={isLogin ? (actualRole === 'candidate' ? "john@email.com" : "name@company.com") : (actualRole === 'candidate' ? "john@email.com" : "name@company.com")}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
                                {isLogin && <Link to="#" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>}
                            </div>
                            <input
                                className="input"
                                style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                minLength={8}
                            />
                            {!isLogin && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>Must be at least 8 chars with uppercase, lowercase, number & special char.</p>}
                        </div>
                        {!isLogin && (
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>Confirm Password</label>
                                <input
                                    className="input"
                                    style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    required
                                    minLength={8}
                                />
                                {form.confirmPassword && (
                                    <p style={{
                                        fontSize: 12, marginTop: 8, fontWeight: 600,
                                        color: form.password === form.confirmPassword ? '#10B981' : '#EF4444',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords don\'t match'}
                                    </p>
                                )}
                            </div>
                        )}
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ 
                                marginTop: 16, width: '100%', padding: '16px', 
                                fontSize: 15, fontWeight: 600, borderRadius: 12,
                                background: actualRole === 'candidate' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                border: 'none',
                                color: 'white',
                                boxShadow: actualRole === 'candidate' ? '0 8px 20px rgba(59,130,246,0.25)' : '0 8px 20px rgba(16,185,129,0.25)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-secondary)' }}>
                        {isLogin ? (
                            <>Don't have an account? <Link to={`/${actualRole}/signup`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link></>
                        ) : (
                            <>Already have an account? <Link to={`/${actualRole}/login`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link></>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Styles for responsive layout */}
            <style>{`
                @media (max-width: 900px) {
                    .auth-left-panel { display: none !important; }
                    .mobile-branding { display: block !important; }
                }
            `}</style>
        </div>
    );
}
