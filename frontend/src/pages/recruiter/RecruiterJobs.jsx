import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

const ROLE_SKILLS = {
    'Frontend Developer': ['React', 'TypeScript', 'Tailwind', 'Git', 'Next.js'],
    'Backend Developer': ['Node.js', 'Python', 'SQL', 'REST API', 'Docker'],
    'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Git', 'TypeScript'],
    'Cloud Developer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
    'Data Scientist': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'SQL'],
};

const ROLES = Object.keys(ROLE_SKILLS);

const SALARY_RANGES = [
    '₹3-5 LPA', '₹5-8 LPA', '₹8-12 LPA', '₹12-18 LPA',
];

const ELIGIBILITY_OPTIONS = ['B. Tech', 'M. Tech', 'Both B. Tech & M. Tech'];

const emptyForm = {
    title: '', role: '', experience: 'Fresher',
    eligibility: '', skills: '', description: '',
    salary: '', company_id: '',
};
const errStyle = { fontSize: 12, color: '#e53e3e', marginTop: 4 };

export default function RecruiterJobs() {
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [errors, setErrors] = useState({});
    const { showToast } = useToast();
    const navigate = useNavigate();

    const load = async () => {
        try {
            const [jobsRes, compRes] = await Promise.all([
                api.get('/recruiter/jobs'),
                api.get('/recruiter/company'),
            ]);
            setJobs(jobsRes.data);
            setCompanies(compRes.data);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(ev => ({ ...ev, [field]: '' }));
    };

    const handleRoleChange = (role) => {
        set('role', role);
        setSelectedSkills([]);
        set('skills', '');
    };

    const toggleSkill = (skill) => {
        setSelectedSkills(prev => {
            const next = prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill];
            setForm(f => ({ ...f, skills: next.join(', ') }));
            setErrors(ev => ({ ...ev, skills: '' }));
            return next;
        });
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Job Title is required.';
        if (!form.role) e.role = 'Please select a role.';
        if (!form.experience) e.experience = 'Please select experience level.';
        if (!form.eligibility) e.eligibility = 'Please select an eligibility.';
        if (selectedSkills.length === 0) e.skills = 'Please select at least one skill.';
        if (!form.salary) e.salary = 'Please select a salary range.';
        if (!form.company_id) e.company_id = 'Please select a company.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            await api.post('/recruiter/jobs', {
                ...form,
                skills: selectedSkills,
            });
            showToast('Job posted!');
            setShowForm(false);
            setForm(emptyForm);
            setSelectedSkills([]);
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    const availableSkills = form.role ? ROLE_SKILLS[form.role] : [];

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Jobs</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{jobs.length} job postings</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setForm(emptyForm); setSelectedSkills([]); setErrors({}); }}>
                    {showForm ? 'Cancel' : '+ Post Job'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                        {/* Job Title */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Job Title *</label>
                            <input
                                className="input"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                style={errors.title ? { borderColor: '#e53e3e' } : {}}
                            />
                            {errors.title && <p style={errStyle}>{errors.title}</p>}
                        </div>

                        {/* Role */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Role *</label>
                            <select
                                className="input"
                                value={form.role}
                                onChange={e => handleRoleChange(e.target.value)}
                                style={errors.role ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select Role</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <p style={errStyle}>{errors.role}</p>}
                        </div>

                        {/* Experience */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Experience *</label>
                            <select
                                className="input"
                                value={form.experience}
                                onChange={e => set('experience', e.target.value)}
                                style={errors.experience ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="Fresher">Fresher</option>
                                <option value="1-3 years">1-3 years</option>
                                <option value="3+ years">3+ years</option>
                                <option value="5+ years">5+ years</option>
                            </select>
                            {errors.experience && <p style={errStyle}>{errors.experience}</p>}
                        </div>

                        {/* Skills — chip selection based on role */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>
                                Skills * {!form.role && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(select a role first)</span>}
                            </label>
                            {form.role ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {availableSkills.map(skill => {
                                        const active = selectedSkills.includes(skill);
                                        return (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: 20,
                                                    border: active ? '1.5px solid #2563eb' : '1.5px solid var(--border)',
                                                    background: active ? '#2563eb' : 'var(--bg-secondary)',
                                                    color: active ? '#ffffff' : 'var(--text-secondary)',
                                                    fontSize: 13,
                                                    cursor: 'pointer',
                                                    fontWeight: active ? 600 : 400,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {active ? '✓ ' : ''}{skill}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: 13, border: `1px solid ${errors.skills ? '#e53e3e' : 'var(--border)'}` }}>
                                    Skills will appear after selecting a role
                                </div>
                            )}
                            {errors.skills && <p style={errStyle}>{errors.skills}</p>}
                        </div>

                        {/* Eligibility */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Eligibility *</label>
                            <select
                                className="input"
                                value={form.eligibility}
                                onChange={e => set('eligibility', e.target.value)}
                                style={errors.eligibility ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select Eligibility</option>
                                {ELIGIBILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {errors.eligibility && <p style={errStyle}>{errors.eligibility}</p>}
                        </div>

                        {/* Salary Range */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Salary Range * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(hidden from candidates)</span></label>
                            <select
                                className="input"
                                value={form.salary}
                                onChange={e => set('salary', e.target.value)}
                                style={errors.salary ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select Salary Range</option>
                                {SALARY_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.salary && <p style={errStyle}>{errors.salary}</p>}
                        </div>

                        {/* Company */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Company *</label>
                            <select
                                className="input"
                                value={form.company_id}
                                onChange={e => set('company_id', e.target.value)}
                                style={errors.company_id ? { borderColor: '#e53e3e' } : {}}
                            >
                                <option value="">Select company</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.company_id && <p style={errStyle}>{errors.company_id}</p>}
                        </div>

                        {/* Description (optional) */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>
                                Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                            </label>
                            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
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
