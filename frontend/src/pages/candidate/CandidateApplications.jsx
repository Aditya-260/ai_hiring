import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function CandidateApplications() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/candidate/applications').then(res => setApps(res.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const statusColors = {
        applied: 'badge-blue',
        aptitude_done: 'badge-yellow',
        interview_done: 'badge-green',
        shortlisted: 'badge-green',
        rejected: 'badge-red',
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>My Applications</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {apps.map((app, i) => (
                    <div key={app.id} className="card animate-slide-up" style={{ padding: 20, animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{app.job_title}</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Applied {app.created_at?.split('T')[0]}</p>
                            </div>
                            <span className={`badge ${statusColors[app.status] || 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                                {app.status?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                ))}
                {apps.length === 0 && (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
                        <p>No applications yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
