import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

const ROLE_SKILLS = {
    'Frontend Developer': [
        'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript',
        'Next.js', 'Nuxt.js', 'HTML5', 'CSS3', 'Tailwind CSS',
        'Sass/SCSS', 'Redux', 'Zustand', 'Webpack', 'Vite',
        'Jest', 'Cypress', 'Figma', 'Git', 'GraphQL',
    ],
    'Backend Developer': [
        'Node.js', 'Python', 'Java', 'Go', 'Rust',
        'Express.js', 'FastAPI', 'Django', 'Spring Boot', 'NestJS',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
        'REST API', 'GraphQL', 'gRPC', 'Docker', 'Kafka',
        'RabbitMQ', 'Microservices', 'JWT', 'OAuth2', 'Git',
    ],
    'Full Stack Developer': [
        'React', 'Node.js', 'TypeScript', 'Python', 'Java',
        'Next.js', 'Express.js', 'FastAPI', 'PostgreSQL', 'MongoDB',
        'Redis', 'Docker', 'REST API', 'GraphQL', 'Git',
        'CI/CD', 'AWS', 'Tailwind CSS', 'Jest', 'WebSockets',
    ],
    'Cloud Developer': [
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
        'Terraform', 'Ansible', 'Helm', 'AWS Lambda', 'Azure Functions',
        'S3', 'EC2', 'RDS', 'CloudFormation', 'IAM',
        'VPC', 'Load Balancing', 'CDN', 'Monitoring', 'Python',
    ],
    'DevOps Engineer': [
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins',
        'GitHub Actions', 'GitLab CI', 'ArgoCD', 'Helm', 'Linux',
        'Bash Scripting', 'Python', 'AWS', 'Azure', 'GCP',
        'Prometheus', 'Grafana', 'ELK Stack', 'Nginx', 'Vault',
    ],
    'Data Scientist': [
        'Python', 'R', 'Machine Learning', 'Deep Learning', 'NLP',
        'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
        'SQL', 'Spark', 'Hadoop', 'Tableau', 'Power BI',
        'Statistics', 'A/B Testing', 'Feature Engineering', 'MLflow', 'Jupyter',
    ],
};

const ROLES = Object.keys(ROLE_SKILLS);

const ROLE_TITLE_SUGGESTIONS = {
    'Frontend Developer':   'e.g. Senior Frontend Developer',
    'Backend Developer':    'e.g. Backend Engineer – Node.js & Python',
    'Full Stack Developer':  'e.g. Full Stack Engineer (React + Node)',
    'Cloud Developer':      'e.g. Cloud Infrastructure Engineer',
    'DevOps Engineer':      'e.g. DevOps / Platform Engineer',
    'Data Scientist':       'e.g. Data Scientist – NLP & ML',
};

const ELIGIBILITY_OPTIONS = ['B. Tech', 'M. Tech', 'Both B. Tech & M. Tech'];

const emptyForm = {
    title: '', role: '', experience: 'Fresher',
    eligibility: '', skills: '', description: '',
    company_id: '', expires_in_days: '',
};

const errStyle = { fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: 500 };

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
        if (!form.eligibility) e.eligibility = 'Please select eligibility.';
        if (selectedSkills.length === 0) e.skills = 'Please select at least one skill.';
        if (!form.company_id) e.company_id = 'Please select a company.';
        if (!form.expires_in_days) e.expires_in_days = 'Please select how long the job should stay active.';
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
                expires_in_days: parseInt(form.expires_in_days),
            });
            showToast('Job posted successfully!', 'success');
            setShowForm(false);
            setForm(emptyForm);
            setSelectedSkills([]);
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    if (loading) return (
        <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--success)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading workspace...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const availableSkills = form.role ? ROLE_SKILLS[form.role] : [];

    // ── Expiry helpers ───────────────────────────────────
    const getDaysLeft = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const expiryBadge = (job) => {
        if (job.is_expired) {
            return (
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
                    letterSpacing: 0.3
                }}>⛔ Expired</span>
            );
        }
        const days = getDaysLeft(job.expires_at);
        if (days === null) return null;
        const color = days <= 3
            ? { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }
            : days <= 7
            ? { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' }
            : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
        return (
            <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: color.bg, color: color.text, border: `1px solid ${color.border}`,
                letterSpacing: 0.3
            }}>
                ⏳ {days <= 0 ? 'Expires today' : `${days}d left`}
            </span>
        );
    };

    const activeJobs = jobs.filter(j => !j.is_expired);
    const expiredJobs = jobs.filter(j => j.is_expired);

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
            {/* Header Area */}
            <div style={{ 
                background: 'white', borderBottom: '1px solid var(--border)',
                padding: '40px 32px', marginBottom: 32
            }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: '#1C1917', letterSpacing: '-0.5px' }}>
                            Job Listings
                        </h1>
                        <p style={{ color: '#57534E', fontSize: 16, margin: 0 }}>
                            Manage your open roles and candidate applications.
                        </p>
                    </div>
                    <button 
                        className="btn" 
                        style={{ 
                            background: showForm ? '#F5F5F4' : '#10B981', 
                            color: showForm ? '#1C1917' : 'white',
                            border: showForm ? '1px solid #E7E5E4' : 'none',
                            padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10,
                            boxShadow: showForm ? 'none' : '0 8px 16px rgba(16,185,129,0.25)',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => { setShowForm(!showForm); setForm(emptyForm); setSelectedSkills([]); setErrors({}); }}
                    >
                        {showForm ? 'Cancel Creation' : '+ Create New Job'}
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px 64px' }}>
                
                {/* Statistics Banner */}
                {!showForm && jobs.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Active Jobs', value: activeJobs.length, color: '#10B981' },
                            { label: 'Expired Jobs', value: expiredJobs.length, color: '#EF4444' },
                            { label: 'Total Applicants', value: jobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0), color: '#3B82F6' },
                        ].map((stat, i) => (
                            <div key={i} style={{ background: 'white', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#57534E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
                                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Job Creation Form */}
                {showForm && (
                    <div className="card animate-slide-up" style={{ padding: 32, marginBottom: 32, border: '1px solid var(--border)', background: 'white', borderRadius: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                            Post a New Opportunity
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>Job Title *</label>
                                    <input
                                        className="input"
                                        placeholder={form.role ? ROLE_TITLE_SUGGESTIONS[form.role] : 'Select a role first to get title suggestions'}
                                        value={form.title}
                                        onChange={e => set('title', e.target.value)}
                                        style={{ padding: '12px 14px', borderRadius: 8, ...(errors.title ? { borderColor: '#ef4444' } : {}) }}
                                    />
                                    {errors.title && <p style={errStyle}>{errors.title}</p>}
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>Role *</label>
                                    <select
                                        className="input"
                                        value={form.role}
                                        onChange={e => handleRoleChange(e.target.value)}
                                        style={{ padding: '12px 14px', borderRadius: 8, ...(errors.role ? { borderColor: '#ef4444' } : {}) }}
                                    >
                                        <option value="">Select Role Category</option>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    {errors.role && <p style={errStyle}>{errors.role}</p>}
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>Experience Required *</label>
                                    <select
                                        className="input"
                                        value={form.experience}
                                        onChange={e => set('experience', e.target.value)}
                                        style={{ padding: '12px 14px', borderRadius: 8, ...(errors.experience ? { borderColor: '#ef4444' } : {}) }}
                                    >
                                        <option value="Fresher">Fresher (0 years)</option>
                                        <option value="1-3 years">1-3 years</option>
                                        <option value="3+ years">3+ years</option>
                                        <option value="5+ years">5+ years</option>
                                    </select>
                                    {errors.experience && <p style={errStyle}>{errors.experience}</p>}
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12, color: '#1C1917' }}>
                                        Required Skills * {!form.role && <span style={{ fontWeight: 400, color: '#A8A29E' }}>(select a role first)</span>}
                                    </label>
                                    {form.role ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            {availableSkills.map(skill => {
                                                const active = selectedSkills.includes(skill);
                                                return (
                                                    <button
                                                        key={skill}
                                                        type="button"
                                                        onClick={() => toggleSkill(skill)}
                                                        style={{
                                                            padding: '8px 16px', borderRadius: 24,
                                                            border: active ? '1px solid #10B981' : '1px solid #E7E5E4',
                                                            background: active ? '#ECFDF5' : 'white',
                                                            color: active ? '#047857' : '#57534E',
                                                            fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 500,
                                                            transition: 'all 0.2s',
                                                            boxShadow: active ? '0 2px 8px rgba(16,185,129,0.15)' : 'none'
                                                        }}
                                                    >
                                                        {active ? '✓ ' : '+ '}{skill}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '16px', borderRadius: 8, background: '#F5F5F4', color: '#A8A29E', fontSize: 13, textAlign: 'center', border: `1px dashed ${errors.skills ? '#ef4444' : '#D6D3D1'}` }}>
                                            Skills will appear after selecting a role
                                        </div>
                                    )}
                                    {errors.skills && <p style={errStyle}>{errors.skills}</p>}
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>Eligibility *</label>
                                    <select
                                        className="input"
                                        value={form.eligibility}
                                        onChange={e => set('eligibility', e.target.value)}
                                        style={{ padding: '12px 14px', borderRadius: 8, ...(errors.eligibility ? { borderColor: '#ef4444' } : {}) }}
                                    >
                                        <option value="">Select Minimum Degree</option>
                                        {ELIGIBILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    {errors.eligibility && <p style={errStyle}>{errors.eligibility}</p>}
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>Hiring Company *</label>
                                    <select
                                        className="input"
                                        value={form.company_id}
                                        onChange={e => set('company_id', e.target.value)}
                                        style={{ padding: '12px 14px', borderRadius: 8, ...(errors.company_id ? { borderColor: '#ef4444' } : {}) }}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.company_id && <p style={errStyle}>{errors.company_id}</p>}
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>
                                        Job Description <span style={{ fontWeight: 400, color: '#A8A29E' }}>(optional)</span>
                                    </label>
                                    <textarea 
                                        className="input" 
                                        rows={4} 
                                        style={{ padding: '16px', borderRadius: 8, resize: 'vertical' }}
                                        placeholder="Add any extra details..."
                                        value={form.description} 
                                        onChange={e => set('description', e.target.value)} 
                                    />
                                </div>

                                {/* ── Expiry Duration ── */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C1917' }}>
                                        Job Active Duration *
                                        <span style={{ fontWeight: 400, color: '#A8A29E', marginLeft: 6 }}>— job auto-vanishes after this period</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        {[
                                            { label: '7 days', sub: 'Short sprint', value: '7' },
                                            { label: '14 days', sub: '2 weeks', value: '14' },
                                            { label: '30 days', sub: '1 month', value: '30' },
                                            { label: '60 days', sub: '2 months', value: '60' },
                                        ].map(opt => {
                                            const active = form.expires_in_days === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => set('expires_in_days', opt.value)}
                                                    style={{
                                                        padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
                                                        border: active
                                                            ? '2px solid #10B981'
                                                            : `1px solid ${errors.expires_in_days ? '#ef4444' : '#E7E5E4'}`,
                                                        background: active ? '#ECFDF5' : 'white',
                                                        color: active ? '#047857' : '#57534E',
                                                        fontWeight: active ? 700 : 500,
                                                        transition: 'all 0.2s',
                                                        boxShadow: active ? '0 2px 8px rgba(16,185,129,0.15)' : 'none',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                                        minWidth: 90,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 14 }}>{opt.label}</span>
                                                    <span style={{ fontSize: 11, opacity: 0.7 }}>{opt.sub}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.expires_in_days && <p style={errStyle}>{errors.expires_in_days}</p>}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <button className="btn btn-primary" type="submit" style={{ padding: '12px 32px', fontSize: 15, background: '#10B981', borderRadius: 8 }}>
                                    Publish Job Post
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Jobs Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {jobs.map((j, i) => (
                        <div key={j.id} className="card animate-slide-up" style={{ 
                            padding: 24, borderRadius: 16, border: '1px solid var(--border)',
                            background: j.is_expired ? '#FAFAFA' : 'white',
                            opacity: j.is_expired ? 0.75 : 1,
                            animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards',
                            transition: 'all 0.2s', cursor: 'pointer'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = j.is_expired ? '#D6D3D1' : '#A7F3D0'; e.currentTarget.style.boxShadow = j.is_expired ? '0 4px 12px rgba(0,0,0,0.06)' : '0 8px 24px rgba(16,185,129,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                        onClick={() => navigate(`/recruiter/job/${j.id}/candidates`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div style={{ 
                                        width: 52, height: 52, borderRadius: 12, 
                                        background: j.is_expired
                                            ? 'linear-gradient(135deg, #F5F5F4, #E7E5E4)'
                                            : 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                                        border: `1px solid ${j.is_expired ? '#D6D3D1' : '#A7F3D0'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20, fontWeight: 700, color: j.is_expired ? '#A8A29E' : '#059669'
                                    }}>
                                        {j.company_name ? j.company_name.charAt(0).toUpperCase() : '🏢'}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: j.is_expired ? '#A8A29E' : '#1C1917' }}>{j.title}</h3>
                                            {expiryBadge(j)}
                                        </div>
                                        <p style={{ fontSize: 14, color: '#57534E', margin: '0 0 10px' }}>{j.company_name}</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 12 }}>{j.experience}</span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: 12 }}>{j.role}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1C1917', lineHeight: 1 }}>{j.applicant_count || 0}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#A8A29E', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Candidates</div>
                                    </div>
                                    {!j.is_expired && (
                                        <button 
                                            className="btn" 
                                            style={{ 
                                                background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', 
                                                padding: '8px 20px', borderRadius: 8, fontWeight: 600, transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#10B981'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                        >
                                            Manage
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {jobs.length === 0 && !showForm && (
                        <div style={{ 
                            padding: '64px 24px', textAlign: 'center', background: 'white', 
                            borderRadius: 16, border: '1px dashed #D6D3D1', marginTop: 20 
                        }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>💼</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1C1917' }}>No jobs posted yet</h3>
                            <p style={{ color: '#57534E', maxWidth: 400, margin: '0 auto 24px' }}>
                                Create your first job posting to attract candidates and leverage our AI screening tools.
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ background: '#10B981', padding: '10px 24px', borderRadius: 8 }}>
                                + Post a Job
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
