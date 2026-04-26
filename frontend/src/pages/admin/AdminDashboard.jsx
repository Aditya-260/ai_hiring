import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard').then(res => setStats(res.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    const cards = [
        { label: 'Total Candidates', value: stats?.total_candidates, icon: '👤', gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
        { label: 'Total Recruiters', value: stats?.total_recruiters, icon: '🧑‍💼', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
        { label: 'Companies', value: stats?.total_companies, icon: '🏢', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
        { label: 'Job Postings', value: stats?.total_jobs, icon: '📋', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
        { label: 'Applications', value: stats?.total_applications, icon: '📨', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
        { label: 'Aptitude Questions', value: stats?.total_questions, icon: '❓', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
    ];

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Overview of Beyond-Hiring</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
                {cards.map((c, i) => (
                    <div key={i} className="animate-slide-up" style={{ 
                        padding: 24, animationDelay: `${i * 0.05}s`, animationFillMode: 'both',
                        background: 'white', borderRadius: 16,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }} onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                    }} onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)';
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>{c.label}</p>
                                <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{c.value ?? 0}</p>
                            </div>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: c.gradient,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 24, color: 'white'
                            }}>
                                {c.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
