import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const navItems = {
        candidate: [
            { path: '/candidate/jobs', label: 'Jobs' },
            { path: '/candidate/applications', label: 'My Applications' },
            { path: '/candidate/profile', label: 'Profile' },
        ],
        recruiter: [
            { path: '/recruiter/company', label: 'Company' },
            { path: '/recruiter/jobs', label: 'My Jobs' },
            { path: '/recruiter/decisions', label: 'Decisions' },
        ],
        admin: [
            { path: '/admin/dashboard', label: 'Dashboard' },
            { path: '/admin/users', label: 'Users' },
            { path: '/admin/companies', label: 'Companies' },
            { path: '/admin/questions', label: 'Questions' },
            { path: '/admin/logs', label: 'Logs' },
        ],
    };

    const items = navItems[user.role] || [];

    return (
        <nav style={{
            borderBottom: '1px solid rgba(231, 229, 228, 0.7)',
            padding: '0 40px',
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(250, 250, 249, 0.85)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                <Link to={user.role === 'candidate' ? '/candidate/categories' : `/${user.role}/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <span style={{ fontWeight: 800, fontSize: 26, color: 'var(--text-primary)' }}>Beyond-Hiring</span>
                </Link>
                <div style={{ display: 'flex', gap: 6 }}>
                    {items.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: location.pathname === item.path ? 'var(--bg-secondary)' : 'transparent',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { if (location.pathname !== item.path) Object.assign(e.currentTarget.style, { background: 'rgba(0,0,0,0.03)', color: 'var(--text-primary)' }) }}
                            onMouseLeave={e => { if (location.pathname !== item.path) Object.assign(e.currentTarget.style, { background: 'transparent', color: 'var(--text-secondary)' }) }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
                    </div>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                        border: '1px solid rgba(59,130,246,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: 'var(--accent)',
                    }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
                <button
                    onClick={() => { logout(); navigate('/entry'); }}
                    style={{ 
                        padding: '8px 16px', fontSize: 13, fontWeight: 600,
                        background: 'transparent', color: 'var(--text-secondary)',
                        border: 'none', cursor: 'pointer', transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    Log out
                </button>
            </div>
        </nav>
    );
}
