import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SecurityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/logs').then(res => setLogs(res.data)).finally(() => setLoading(false));
    }, []);

    const eventColors = {
        'user_signup': 'badge-green',
        'user_login': 'badge-blue',
        'user_block_toggle': 'badge-red',
        'aptitude_completed': 'badge-yellow',
        'interview_completed': 'badge-green',
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Security & Activity Logs</h1>
            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Event</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>User</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Details</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <span className={`badge ${eventColors[log.event] || 'badge-blue'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>
                                        {log.event?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                    {log.email || log.user_id?.slice(0, 8) || '—'}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                                    {log.details?.role && <span>Role: {log.details.role}</span>}
                                    {log.details?.score != null && <span>Score: {log.details.score}%</span>}
                                    {log.details?.blocked != null && <span>{log.details.blocked ? 'Blocked' : 'Unblocked'}</span>}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                                    {log.timestamp?.replace('T', ' ').slice(0, 19)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No logs yet</div>
                )}
            </div>
        </div>
    );
}
