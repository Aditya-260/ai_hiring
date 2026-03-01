import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function RecruiterJobs() {
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', role: '', experience: 'Fresher', eligibility: '', skills: '', description: '', salary: '', company_id: '' });
    const { showToast } = useToast();
    const navigate = useNavigate();

    const load = async () => {
        try {
            const [jobsRes, compRes] = await Promise.all([api.get('/recruiter/jobs'), api.get('/recruiter/company')]);
            setJobs(jobsRes.data);
            setCompanies(compRes.data);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/recruiter/jobs', {
                ...form,
                skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            });
            showToast('Job posted!');
            setShowForm(false);
            setForm({ title: '', role: '', experience: 'Fresher', eligibility: '', skills: '', description: '', salary: '', company_id: '' });
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Jobs</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{jobs.length} job postings</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Post Job'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Job Title *</label>
                            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Role *</label>
                            <input className="input" placeholder="e.g. Frontend Developer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Experience *</label>
                            <select className="input" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}>
                                <option value="Fresher">Fresher</option>
                                <option value="1-3 years">1-3 years</option>
                                <option value="3+ years">3+ years</option>
                                <option value="5+ years">5+ years</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Skills (comma separated)</label>
                            <input className="input" placeholder="React, Python, SQL" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Eligibility</label>
                            <input className="input" placeholder="B.Tech / B.E." value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Salary (hidden from candidates)</label>
                            <input className="input" placeholder="e.g. ₹6-8 LPA" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Company *</label>
                            <select className="input" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })} required>
                                <option value="">Select company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Description</label>
                            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>Post Job</button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {jobs.map((j, i) => (
                    <div key={j.id} className="card animate-slide-up" style={{ padding: 20, animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{j.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{j.company_name}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className="badge badge-blue">{j.experience}</span>
                                    <span className="badge badge-green">{j.role}</span>
                                    <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                        {j.applicant_count} applicant{j.applicant_count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => navigate(`/recruiter/job/${j.id}/candidates`)}>
                                View Candidates →
                            </button>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && !showForm && (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>💼</p>
                        <p>Post your first job to start receiving applications</p>
                    </div>
                )}
            </div>
        </div>
    );
}
