import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

export default function CandidateJobs() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/candidate/jobs').then(res => setJobs(res.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    // ── Expiry urgency helper ─────────────────────────────
    const getDaysLeft = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const urgencyChip = (expiresAt) => {
        const days = getDaysLeft(expiresAt);
        if (days === null || days > 30) return null;
        const style = days <= 3
            ? { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: days <= 0 ? 'Closes today!' : `Closes in ${days}d` }
            : days <= 7
            ? { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', label: `Closes in ${days}d` }
            : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: `Closes in ${days}d` };
        return (
            <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: style.bg, color: style.text, border: `1px solid ${style.border}`,
            }}>
                ⏰ {style.label}
            </span>
        );
    };

    const handleApply = async (jobId) => {
        try {
            await api.post(`/candidate/apply/${jobId}`);
            showToast('Application submitted! Start your assessment.', 'success');
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
            showToast('Resume uploaded successfully!', 'success');
        } catch {
            showToast('Failed to upload resume', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Discovering opportunities for you...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Top Banner */}
            <div style={{ 
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                padding: '64px 32px 64px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{
                    position: 'absolute', top: '-50%', right: '10%', 
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}/>
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '5%', 
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}/>
                <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                                👋 Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
                            </span>
                            <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-1px' }}>
                                Find your next big role.
                            </h1>
                            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 500, lineHeight: 1.6 }}>
                                Explore curated job opportunities and showcase your skills through our AI-powered assessments.
                            </p>
                        </div>
                        <label className="btn" style={{ 
                            background: 'white', color: '#312E81', 
                            padding: '12px 24px', fontSize: 14, fontWeight: 700,
                            borderRadius: 12, cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
                        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            {uploading ? (
                                <><span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Uploading...</>
                            ) : (
                                <><span>📄</span> Upload Cover / Resume</>
                            )}
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div style={{ maxWidth: 1000, margin: '-24px auto 48px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Recommended for you ({jobs.length})</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {jobs.map((job, i) => (
                        <div key={job.id} className="card animate-slide-up" style={{ 
                            padding: 24, borderRadius: 16,
                            animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards',
                            border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                            transition: 'all 0.3s ease', cursor: 'pointer', background: 'var(--bg-card)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(59,130,246,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'none'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>
                                    <div style={{ 
                                        width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                                        background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                                        border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24, fontWeight: 700, color: '#3B82F6'
                                    }}>
                                        {job.company_name ? job.company_name.charAt(0).toUpperCase() : '🏢'}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{job.title}</h3>
                                            {job.company_name && (
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
                                                    {job.company_name}
                                                </span>
                                            )}
                                        </div>
                                        {job.company_location && (
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: '#94A3B8' }}>📍</span> {job.company_location}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 12 }}>
                                                {job.experience}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: 12 }}>
                                                {job.role}
                                            </span>
                                            {job.skills?.slice(0, 3).map(s => (
                                                <span key={s} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                    {s}
                                                </span>
                                            ))}
                                            {urgencyChip(job.expires_at)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                                    {job.already_applied ? (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/candidate/assessment/${job.id}`); }}
                                        >
                                            Take Assessment ⚡
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn" 
                                            style={{ 
                                                padding: '10px 24px', borderRadius: 10, fontWeight: 600, 
                                                background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                            onClick={(e) => { e.stopPropagation(); handleApply(job.id); }}
                                        >
                                            Apply Now
                                        </button>
                                    )}
                                    
                                    {job.eligibility && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Eligibility:</span>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>{job.eligibility}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {jobs.length === 0 && !loading && (
                        <div style={{ 
                            padding: '64px 24px', textAlign: 'center', background: 'white', 
                            borderRadius: 16, border: '1px dashed var(--border)', marginTop: 20 
                        }}>
                            <div style={{ 
                                width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: 28, margin: '0 auto 16px' 
                            }}>🔍</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>No active jobs found</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
                                We are constantly adding new opportunities. Keep your resume updated and check back soon!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
