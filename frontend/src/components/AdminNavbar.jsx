import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function AdminNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/users', label: 'Users' },
        { path: '/admin/companies', label: 'Companies' },
        { path: '/admin/applications', label: 'Applications' },
        { path: '/admin/questions', label: 'Questions' },
        { path: '/admin/logs', label: 'Logs' },
    ];

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
                <Link to={`/admin/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 54, height: 54, objectFit: 'contain', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--text-primary)' }}>Beyond-Hiring Admin</span>
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
                        A
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>System Admin</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Public Access</div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/entry')}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                >
                    Exit Application
                </button>
            </div>
        </nav>
    );
}
