import { useState, useEffect } from 'react';
import api from '../../api/axios';

const STATUS_CONFIG = {
    'applied': { label: 'Applied', badge: 'badge-blue' },
    'aptitude_done': { label: 'Aptitude ✓', badge: 'badge-yellow' },
    'interview_done': { label: 'Interview ✓', badge: 'badge-green' },
    'rejected': { label: 'Not Passed', badge: 'badge-red' },
};

const RECOMMENDATION_COLOR = {
    'Strong Hire': '#10B981',
    'Hire': '#3B82F6',
    'Maybe': '#F59E0B',
    'No Hire': '#EF4444',
};

export default function ApplicationsOverview() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [search, setSearch] = useState('');
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        api.get('/admin/applications').then(res => setApplications(res.data)).finally(() => setLoading(false));
    }, []);

    const deleteApp = async (id) => {
        try {
            await api.delete(`/admin/applications/${id}`);
            setApplications(prev => prev.filter(a => a.id !== id));
        } catch {
            // silently fail
        } finally {
            setConfirmId(null);
        }
    };

    const roles = ['all', ...new Set(applications.map(a => a.job_title))];

    const filtered = applications.filter(a => {
        if (filterStatus !== 'all' && a.status !== filterStatus) return false;
        if (filterRole !== 'all' && a.job_title !== filterRole) return false;
        if (search && !a.candidate_name.toLowerCase().includes(search.toLowerCase()) &&
            !a.candidate_email.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading applications...</div>;

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Candidate Applications</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} of {applications.length} applications</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                <input
                    className="input"
                    placeholder="🔍 Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 240, fontSize: 13 }}
                />
                <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ maxWidth: 170, fontSize: 13 }}>
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="aptitude_done">Aptitude Done</option>
                    <option value="interview_done">Interview Done</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select className="input" value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ maxWidth: 210, fontSize: 13 }}>
                    {roles.map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            {['Candidate', 'Role', 'Status', 'Aptitude', 'Interview', 'Final', 'Recommendation', 'Integrity', ''].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(app => {
                            const sc = STATUS_CONFIG[app.status] || { label: app.status, badge: 'badge-blue' };
                            const cheating = app.cheating_probability;
                            return (
                                <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    {/* Candidate */}
                                    <td style={{ padding: '12px 14px' }}>
                                        <p style={{ fontWeight: 600, fontSize: 13 }}>{app.candidate_name}</p>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.candidate_email}</p>
                                    </td>
                                    {/* Role */}
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 16 }}>{app.job_icon}</span>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{app.job_title}</span>
                                        </span>
                                    </td>
                                    {/* Status */}
                                    <td style={{ padding: '12px 14px' }}>
                                        <span className={`badge ${sc.badge}`} style={{ fontSize: 11 }}>{sc.label}</span>
                                    </td>
                                    {/* Aptitude */}
                                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                                        {app.aptitude_score != null
                                            ? <span style={{ color: app.aptitude_score >= 40 ? 'var(--success)' : 'var(--danger)' }}>{app.aptitude_score}%</span>
                                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    {/* Interview */}
                                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                                        {app.interview_score != null
                                            ? <span style={{ color: 'var(--accent)' }}>{app.interview_score}</span>
                                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    {/* Final */}
                                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                                        {app.final_score != null
                                            ? <span style={{ color: 'var(--text-primary)' }}>{app.final_score}</span>
                                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    {/* Recommendation */}
                                    <td style={{ padding: '12px 14px' }}>
                                        {app.recommendation
                                            ? <span style={{
                                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                                background: (RECOMMENDATION_COLOR[app.recommendation] || '#3B82F6') + '20',
                                                color: RECOMMENDATION_COLOR[app.recommendation] || '#3B82F6',
                                            }}>{app.recommendation}</span>
                                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    {/* Cheating/Integrity */}
                                    <td style={{ padding: '12px 14px' }}>
                                        {cheating != null
                                            ? <span style={{
                                                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                                background: cheating > 50 ? '#FEF2F2' : cheating > 20 ? '#FFFBEB' : '#ECFDF5',
                                                color: cheating > 50 ? '#EF4444' : cheating > 20 ? '#D97706' : '#10B981',
                                            }}>{cheating}% risk</span>
                                            : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                                    </td>
                                    {/* Delete */}
                                    <td style={{ padding: '8px 10px' }}>
                                        {confirmId === app.id ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 8px' }}>
                                                <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>Delete?</span>
                                                <button className="btn btn-danger" style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => deleteApp(app.id)}>Yes</button>
                                                <button className="btn btn-secondary" style={{ padding: '2px 7px', fontSize: 11 }} onClick={() => setConfirmId(null)}>No</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmId(app.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.35, transition: 'opacity 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={e => e.currentTarget.style.opacity = 0.35}
                                                title="Delete application"
                                            >🗑</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 32, marginBottom: 10 }}>📭</p>
                        <p style={{ fontWeight: 500 }}>No applications found</p>
                        <p style={{ fontSize: 13 }}>Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
