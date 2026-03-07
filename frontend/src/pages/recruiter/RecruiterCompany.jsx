import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function RecruiterCompany() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', website: '', industry: '', location: '' });
    const [websiteType, setWebsiteType] = useState('url'); // 'url' | 'none'
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);
    const { showToast } = useToast();

    const load = () => api.get('/recruiter/company').then(res => setCompanies(res.data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Company Name is required.';
        if (!form.industry) e.industry = 'Please select an industry.';
        if (!form.location) e.location = 'Please select a city.';
        if (websiteType === 'url' && !form.website.trim()) e.website = 'Please enter a website URL or select "None".';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        const payload = { ...form, website: websiteType === 'none' ? 'None' : form.website };
        try {
            if (editId) {
                await api.put(`/recruiter/company/${editId}`, payload);
                showToast('Company updated');
            } else {
                await api.post('/recruiter/company', payload);
                showToast('Company created');
            }
            setShowForm(false);
            setEditId(null);
            setForm({ name: '', description: '', website: '', industry: '', location: '' });
            setWebsiteType('url');
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    const startEdit = (c) => {
        const isNone = c.website === 'None' || !c.website;
        setForm({ name: c.name, description: c.description || '', website: isNone ? '' : (c.website || ''), industry: c.industry || '', location: c.location || '' });
        setWebsiteType(c.website === 'None' ? 'none' : 'url');
        setEditId(c.id);
        setErrors({});
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this company? All associated jobs will also be deleted.')) return;
        try {
            await api.delete(`/recruiter/company/${editId}`);
            showToast('Company deleted');
            setShowForm(false);
            setEditId(null);
            setForm({ name: '', description: '', website: '', industry: '', location: '' });
            setWebsiteType('url');
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    const errStyle = { fontSize: 12, color: '#e53e3e', marginTop: 4 };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Companies</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', website: '', industry: '', location: '' }); setWebsiteType('url'); setErrors({}); }}>
                    {showForm ? 'Cancel' : '+ New Company'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                        {/* Company Name */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Company Name *</label>
                            <input
                                className="input"
                                value={form.name}
                                onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(ev => ({ ...ev, name: '' })); }}
                                style={errors.name ? { borderColor: '#e53e3e' } : {}}
                            />
                            {errors.name && <p style={errStyle}>{errors.name}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Industry *</label>
                            <select
                                className="input"
                                value={form.industry}
                                onChange={e => { setForm({ ...form, industry: e.target.value }); setErrors(ev => ({ ...ev, industry: '' })); }}
                                style={errors.industry ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select Industry</option>
                                <option value="IT">IT</option>
                            </select>
                            {errors.industry && <p style={errStyle}>{errors.industry}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Location *</label>
                            <select
                                className="input"
                                value={form.location}
                                onChange={e => { setForm({ ...form, location: e.target.value }); setErrors(ev => ({ ...ev, location: '' })); }}
                                style={errors.location ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select City</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Bangalore">Bangalore</option>
                                <option value="Hyderabad">Hyderabad</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Kolkata">Kolkata</option>
                                <option value="Pune">Pune</option>
                                <option value="Ahmedabad">Ahmedabad</option>
                                <option value="Jaipur">Jaipur</option>
                                <option value="Surat">Surat</option>
                                <option value="Lucknow">Lucknow</option>
                                <option value="Chandigarh">Chandigarh</option>
                                <option value="Bhopal">Bhopal</option>
                                <option value="Indore">Indore</option>
                                <option value="Noida">Noida</option>
                                <option value="Gurgaon">Gurgaon</option>
                                <option value="Coimbatore">Coimbatore</option>
                                <option value="Kochi">Kochi</option>
                                <option value="Nagpur">Nagpur</option>
                                <option value="Visakhapatnam">Visakhapatnam</option>
                            </select>
                            {errors.location && <p style={errStyle}>{errors.location}</p>}
                        </div>

                        {/* Website */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>Website *</label>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="websiteType"
                                        checked={websiteType === 'url'}
                                        onChange={() => { setWebsiteType('url'); setErrors(ev => ({ ...ev, website: '' })); }}
                                    />
                                    Enter URL manually
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="websiteType"
                                        checked={websiteType === 'none'}
                                        onChange={() => { setWebsiteType('none'); setForm(f => ({ ...f, website: '' })); setErrors(ev => ({ ...ev, website: '' })); }}
                                    />
                                    None (no website)
                                </label>
                            </div>
                            {websiteType === 'url' && (
                                <input
                                    className="input"
                                    placeholder="https://example.com"
                                    value={form.website}
                                    onChange={e => { setForm({ ...form, website: e.target.value }); setErrors(ev => ({ ...ev, website: '' })); }}
                                    style={errors.website ? { borderColor: '#e53e3e' } : {}}
                                />
                            )}
                            {errors.website && <p style={errStyle}>{errors.website}</p>}
                        </div>

                        {/* Description (optional) */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button className="btn btn-primary" type="submit">
                            {editId ? 'Update Company' : 'Create Company'}
                        </button>
                        {editId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e53e3e', background: 'transparent', color: '#e53e3e', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                            >
                                🗑 Delete
                            </button>
                        )}
                    </div>
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
