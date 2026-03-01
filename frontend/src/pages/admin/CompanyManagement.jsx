import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function CompanyManagement() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Company Management</h1>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>ID</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Industry</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Website</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{c.id.slice(-6)}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{c.industry || 'N/A'}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    {c.website ? (
                                        <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                                            Link ↗
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <button
                                        className="btn btn-danger"
                                        style={{ fontSize: 12, padding: '4px 12px' }}
                                        onClick={() => deleteCompany(c.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {companies.length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No companies found</div>
                )}
            </div>
        </div>
    );
}
