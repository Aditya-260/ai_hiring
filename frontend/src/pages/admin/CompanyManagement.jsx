import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function CompanyManagement() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        api.get('/admin/companies').then(res => setCompanies(res.data)).finally(() => setLoading(false));
    }, []);

    const deleteCompany = async (companyId) => {
        if (!window.confirm("Are you sure you want to permanently delete this company?")) return;

        try {
            await api.delete(`/admin/companies/${companyId}`);
            setCompanies(companies.filter(c => c.id !== companyId));
            showToast("Company permanently deleted", "success");
        } catch (err) {
            showToast(err.response?.data?.detail || "Error deleting company", "error");
        }
    };

    const filtered = companies.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Company Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage {companies.length} registered companies</p>
                </div>
                <input 
                    type="text" 
                    placeholder="Search companies..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)',
                        fontSize: 14, width: 260, outline: 'none'
                    }}
                />
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
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industry</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Website</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>{c.id.slice(-6)}</td>
                                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                                        <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: 20, fontSize: 13 }}>{c.industry || '—'}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {c.website ? (
                                            <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ 
                                                color: '#2563EB', textDecoration: 'none', fontWeight: 500,
                                                display: 'inline-flex', alignItems: 'center', gap: 4 
                                            }}>
                                                Visit <span style={{ fontSize: 16 }}>↗</span>
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <button
                                            style={{ 
                                                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                                                padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                color: '#DC2626', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                            onClick={() => deleteCompany(c.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 40, marginBottom: 16 }}>🏢</p>
                        <p style={{ fontWeight: 500, fontSize: 16 }}>No companies found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
