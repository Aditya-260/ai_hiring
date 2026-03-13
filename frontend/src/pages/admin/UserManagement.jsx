import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
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

    const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>User Management</h1>
                <div style={{ display: 'flex', gap: 4 }}>
                    {['all', 'candidate', 'recruiter'].map(f => (
                        <button
                            key={f}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: 12, padding: '6px 14px', textTransform: 'capitalize' }}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Email</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Role</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.name}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span className={`badge ${u.blocked ? 'badge-red' : 'badge-green'}`}>
                                        {u.blocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    {confirmId === u.id ? (
                                        // Inline confirmation row
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '4px 10px' }}>
                                            <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Delete?</span>
                                            <button
                                                className="btn btn-danger"
                                                style={{ fontSize: 12, padding: '3px 10px' }}
                                                onClick={() => deleteUser(u.id)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: 12, padding: '3px 10px' }}
                                                onClick={() => setConfirmId(null)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'inline-flex', gap: 8 }}>
                                            <button
                                                className={`btn ${u.blocked ? 'btn-success' : 'btn-warning'}`}
                                                style={{ fontSize: 12, padding: '4px 12px' }}
                                                onClick={() => toggleBlock(u.id, u.blocked)}
                                            >
                                                {u.blocked ? 'Unblock' : 'Block'}
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                style={{ fontSize: 12, padding: '4px 12px' }}
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
                {filtered.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>
                )}
            </div>
        </div>
    );
}
