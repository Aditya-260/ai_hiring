import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function CandidateJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/candidate/jobs').then(res => setJobs(res.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleApply = async (jobId) => {
        try {
            await api.post(`/candidate/apply/${jobId}`);
            showToast('Application submitted! Start your assessment.');
            setJobs(jobs.map(j => j.id === jobId ? { ...j, already_applied: true } : j));
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to apply';
            if (msg.includes('resume')) {
                showToast('Please upload your resume first', 'error');
            } else {
                showToast(msg, 'error');
            }
        }
    };

    const handleResume = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/candidate/resume', formData);
            showToast('Resume uploaded!');
        } catch {
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</div>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Job Listings</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{jobs.length} open positions</p>
                </div>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    {uploading ? 'Uploading...' : '📄 Upload Resume'}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} style={{ display: 'none' }} />
                </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {jobs.map((job, i) => (
                    <div key={job.id} className="card animate-slide-up" style={{ padding: 24, animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{job.title}</h3>
                                    {job.company_name && (
                                        <span style={{ fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                            🏢 {job.company_name}
                                        </span>
                                    )}
                                </div>
                                {job.company_location && (
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                                        📍 {job.company_location}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <span className="badge badge-blue">{job.experience}</span>
                                    <span className="badge badge-green">{job.role}</span>
                                    {job.skills?.slice(0, 3).map(s => (
                                        <span key={s} className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{s}</span>
                                    ))}
                                </div>
                                {job.eligibility && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🎓 Who can apply:</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f3e8ff', border: '1px solid #ddd6fe', padding: '2px 10px', borderRadius: 20 }}>
                                            {job.eligibility}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {job.already_applied ? (
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize: 13 }}
                                        onClick={() => navigate(`/candidate/assessment/${job.id}`)}
                                    >
                                        Start Assessment →
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => handleApply(job.id)}>
                                        Apply Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>🔍</p>
                        <p style={{ fontWeight: 500 }}>No jobs available right now</p>
                        <p style={{ fontSize: 13 }}>Check back later for new openings</p>
                    </div>
                )}
            </div>
        </div>
    );
}
