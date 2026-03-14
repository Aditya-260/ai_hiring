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
            background: 'white',
            borderBottom: '1px solid var(--border)',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255,255,255,0.9)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <Link to={user.role === 'candidate' ? '/candidate/categories' : `/${user.role}/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--accent) 0%, #8B5CF6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 14,
                    }}>AI</div>
                    <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>HireAI</span>
                </Link>
                <div style={{ display: 'flex', gap: 4 }}>
                    {items.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)',
                                background: location.pathname === item.path ? 'var(--accent-light)' : 'transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
                    }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/entry'); }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
