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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Overview of the AI Hiring Platform</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {cards.map((c, i) => (
                    <div key={i} className="card animate-slide-up" style={{ padding: 20, animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{c.label}</p>
                                <p style={{ fontSize: 28, fontWeight: 700 }}>{c.value ?? 0}</p>
                            </div>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: c.gradient,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18,
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
