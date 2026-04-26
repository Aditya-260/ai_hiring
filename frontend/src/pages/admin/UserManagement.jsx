import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [confirmId, setConfirmId] = useState(null); // id pending delete confirmation
    const { showToast } = useToast();

    useEffect(() => {
        api.get('/admin/users').then(res => setUsers(res.data)).finally(() => setLoading(false));
    }, []);

    const toggleBlock = async (userId, blocked) => {
        try {
            await api.put(`/admin/users/${userId}/block`, { blocked: !blocked });
            setUsers(users.map(u => u.id === userId ? { ...u, blocked: !blocked } : u));
            showToast(`User ${blocked ? 'unblocked' : 'blocked'}`);
        } catch (err) {
            showToast('Error', 'error');
        }
    };

    const deleteUser = async (userId) => {
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            showToast('User permanently deleted', 'success');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error deleting user', 'error');
        } finally {
            setConfirmId(null);
        }
    };

    const filtered = users.filter(u => {
        const matchesRole = filter === 'all' || u.role === filter;
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>User Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage {users.length} registered candidates and recruiters</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)',
                            fontSize: 14, width: 240, outline: 'none'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 4, background: 'white', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                        {['all', 'candidate', 'recruiter'].map(f => (
                            <button
                                key={f}
                                style={{ 
                                    fontSize: 13, padding: '8px 16px', textTransform: 'capitalize', borderRadius: 8,
                                    fontWeight: filter === f ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s',
                                    background: filter === f ? 'var(--text-primary)' : 'transparent',
                                    color: filter === f ? 'white' : 'var(--text-secondary)',
                                    border: 'none'
                                }}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
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
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span className={`badge ${u.role === 'recruiter' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>{u.role}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                                            background: u.blocked ? '#FEF2F2' : '#F0FDF4',
                                            color: u.blocked ? '#DC2626' : '#16A34A',
                                        }}>
                                            {u.blocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        {confirmId === u.id ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '4px 10px' }}>
                                                <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Delete permanently?</span>
                                                <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }} onClick={() => deleteUser(u.id)}>Yes</button>
                                                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }} onClick={() => setConfirmId(null)}>No</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'inline-flex', gap: 8 }}>
                                                <button
                                                    style={{ 
                                                        background: 'white', border: '1px solid var(--border)', borderRadius: 8,
                                                        padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                        color: u.blocked ? '#16A34A' : '#D97706', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                    onClick={() => toggleBlock(u.id, u.blocked)}
                                                >
                                                    {u.blocked ? 'Unblock' : 'Block'}
                                                </button>
                                                <button
                                                    style={{ 
                                                        background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                                                        padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                        color: '#DC2626', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                                    onClick={() => setConfirmId(u.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 40, marginBottom: 16 }}>👥</p>
                        <p style={{ fontWeight: 500, fontSize: 16 }}>No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
