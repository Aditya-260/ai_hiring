import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function RecruiterCompany() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', website: '', industry: '', location: '' });
    const [editId, setEditId] = useState(null);
    const { showToast } = useToast();

    const load = () => api.get('/recruiter/company').then(res => setCompanies(res.data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/recruiter/company/${editId}`, form);
                showToast('Company updated');
            } else {
                await api.post('/recruiter/company', form);
                showToast('Company created');
            }
            setShowForm(false);
            setEditId(null);
            setForm({ name: '', description: '', website: '', industry: '', location: '' });
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    const startEdit = (c) => {
        setForm({ name: c.name, description: c.description || '', website: c.website || '', industry: c.industry || '', location: c.location || '' });
        setEditId(c.id);
        setShowForm(true);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Companies</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', website: '', industry: '', location: '' }); }}>
                    {showForm ? 'Cancel' : '+ New Company'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Company Name *</label>
                            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Industry</label>
                            <input className="input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Location</label>
                            <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Website</label>
                            <input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Description</label>
                            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>
                        {editId ? 'Update Company' : 'Create Company'}
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {companies.map((c, i) => (
                    <div key={c.id} className="card animate-slide-up" style={{ padding: 20, animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{c.name}</h3>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {c.industry && <span className="badge badge-blue">{c.industry}</span>}
                                    {c.location && <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>📍 {c.location}</span>}
                                </div>
                                {c.description && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.description}</p>}
                            </div>
                            <button className="btn btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => startEdit(c)}>Edit</button>
                        </div>
                    </div>
                ))}
                {companies.length === 0 && !showForm && (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>🏢</p>
                        <p>Create your first company to start posting jobs</p>
                    </div>
                )}
            </div>
        </div>
    );
}
