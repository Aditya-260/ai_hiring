import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function EntryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const routes = { candidate: '/candidate/jobs', recruiter: '/recruiter/company', admin: '/admin/dashboard' };
            navigate(routes[user.role] || '/entry');
        }
    }, [user, navigate]);

    const roles = [
        {
            key: 'candidate',
            title: 'Candidate',
            desc: 'Find your dream job and showcase your skills through AI-powered assessments',
            icon: '👤',
            gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        },
        {
            key: 'recruiter',
            title: 'Recruiter',
            desc: 'Post jobs, evaluate candidates and make smarter hiring decisions with AI insights',
            icon: '🏢',
            gradient: 'linear-gradient(135deg, #10B981, #059669)',
        },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: 'var(--bg-primary)',
        }}>
            <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 24,
                    boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                }}>AI</div>
                <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
                    Welcome to <span style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HireAI</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>
                    AI-powered recruitment platform that streamlines hiring with intelligent assessments
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                maxWidth: 960,
                width: '100%',
            }}>
                {roles.map((role, i) => (
                    <div
                        key={role.key}
                        className="card animate-slide-up"
                        style={{
                            padding: 28,
                            cursor: 'pointer',
                            animationDelay: `${i * 0.1}s`,
                            animationFillMode: 'backwards',
                        }}
                        onClick={() => navigate(`/${role.key}/login`)}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: role.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, marginBottom: 16,
                            boxShadow: `0 4px 12px ${role.key === 'candidate' ? 'rgba(59,130,246,0.2)' : role.key === 'recruiter' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        }}>
                            {role.icon}
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{role.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
                            {role.desc}
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, fontSize: 13 }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/${role.key}/login`); }}
                            >
                                Login
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, fontSize: 13 }}
                                onClick={(e) => { e.stopPropagation(); navigate(`/${role.key}/signup`); }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
