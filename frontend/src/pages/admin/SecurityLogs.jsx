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
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Security & Activity Logs</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Monitor platform events and system integrity</p>
            </div>
            
            <div style={{ 
                background: 'white', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.04)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span className={`badge ${eventColors[log.event] || 'badge-blue'}`} style={{ textTransform: 'capitalize', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>
                                            {log.event?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {log.email || log.user_id?.slice(0, 8) || '—'}
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {log.details?.role && <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Role: {log.details.role}</span>}
                                            {log.details?.score != null && <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Score: {log.details.score}%</span>}
                                            {log.details?.blocked != null && <span style={{ background: log.details.blocked ? '#FEF2F2' : '#F0FDF4', color: log.details.blocked ? '#DC2626' : '#16A34A', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{log.details.blocked ? 'Blocked' : 'Unblocked'}</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
                                        {log.timestamp?.replace('T', ' ').slice(0, 19)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && (
                    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
                        <p style={{ fontWeight: 500, fontSize: 16 }}>No logs yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
