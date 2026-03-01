import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function JobCategories() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null); // jobId being applied to
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [pendingJobId, setPendingJobId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [hasResume, setHasResume] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get('/candidate/jobs'),
            api.get('/candidate/profile'),
        ]).then(([jobsRes, profileRes]) => {
            setJobs(jobsRes.data);
            setHasResume(!!profileRes.data.resume_url);
        }).catch(() => {
            showToast('Failed to load jobs', 'error');
        }).finally(() => setLoading(false));
    }, []);

    const handleApply = async (job) => {
        if (job.already_applied) {
            // Already applied — go directly to assessment
            navigate(`/candidate/assessment/${job.id}`);
            return;
        }
        if (!hasResume) {
            // Need resume first
            setPendingJobId(job.id);
            setShowResumeModal(true);
            return;
        }
        await submitApplication(job.id);
    };

    const submitApplication = async (jobId) => {
        setApplying(jobId);
        try {
            await api.post(`/candidate/apply/${jobId}`);
            showToast('Application submitted! Starting your assessment...');
            navigate(`/candidate/assessment/${jobId}`);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to apply';
            showToast(msg, 'error');
        } finally {
            setApplying(null);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/candidate/resume', formData);
            setHasResume(true);
            showToast('Resume uploaded successfully!');
            setShowResumeModal(false);
            // Now apply to the pending job
            if (pendingJobId) {
                await submitApplication(pendingJobId);
                setPendingJobId(null);
            }
        } catch {
            showToast('Upload failed. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (job) => {
        if (!job.already_applied) return null;
        const statusMap = {
            'applied': { label: 'Applied', color: '#3B82F6', bg: '#EFF6FF' },
            'aptitude_done': { label: 'Aptitude Done', color: '#F59E0B', bg: '#FFFBEB' },
            'interview_done': { label: 'Interview Done', color: '#10B981', bg: '#ECFDF5' },
            'rejected': { label: 'Not Selected', color: '#EF4444', bg: '#FEF2F2' },
        };
        const s = statusMap[job.application_status] || { label: 'Applied', color: '#3B82F6', bg: '#EFF6FF' };
        return (
            <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                borderRadius: 20, background: s.bg, color: s.color,
            }}>
                {s.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse-soft 1.5s infinite' }}>⚡</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Resume Modal */}
            {showResumeModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 20,
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Upload Your Resume</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Please upload your resume before applying. We use it to tailor your AI interview.
                            </p>
                        </div>
                        <label style={{
                            display: 'block', width: '100%',
                            border: '2px dashed var(--border)', borderRadius: 12,
                            padding: '24px 20px', textAlign: 'center',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            background: 'var(--bg-secondary)', transition: 'all 0.2s',
                        }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                            <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {uploading ? 'Uploading...' : 'Click to upload'}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, DOC or DOCX supported</p>
                        </label>
                        <button
                            className="btn btn-secondary"
                            onClick={() => { setShowResumeModal(false); setPendingJobId(null); }}
                            style={{ width: '100%', marginTop: 16 }}
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20,
                        marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                        <span>⚡</span> AI-Powered Hiring
                    </div>
                    <h1 style={{
                        fontSize: 36, fontWeight: 800, marginBottom: 14,
                        background: 'linear-gradient(135deg, #1C1917 0%, #57534E 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        lineHeight: 1.2,
                    }}>
                        Choose Your Role
                    </h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                        Select a job category, upload your resume, and take our AI-powered aptitude &amp; interview assessment.
                    </p>

                    {!hasResume && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            marginTop: 20, padding: '10px 18px',
                            background: 'var(--warning-light)', border: '1px solid #FDE68A',
                            borderRadius: 10, fontSize: 13, color: '#92400E',
                        }}>
                            <span>📄</span>
                            <span>You haven't uploaded a resume yet — you'll be prompted when you apply.</span>
                        </div>
                    )}
                </div>

                {/* Job category grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: 24,
                }}>
                    {jobs.map((job, i) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            index={i}
                            applying={applying}
                            onApply={() => handleApply(job)}
                            statusBadge={getStatusBadge(job)}
                        />
                    ))}
                </div>

                {/* Bottom info */}
                <div style={{ marginTop: 56, textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', gap: 32, padding: '20px 36px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, boxShadow: 'var(--shadow)',
                    }}>
                        {[
                            { icon: '⏱', label: 'Aptitude Test', value: '30 min · 20 MCQs' },
                            { icon: '🤖', label: 'AI Interview', value: '45 min · 5 Questions' },
                            { icon: '📊', label: 'Results', value: 'Instant Feedback' },
                        ].map(item => (
                            <div key={item.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function JobCard({ job, index, applying, onApply, statusBadge }) {
    const [hovered, setHovered] = useState(false);
    const isApplying = applying === job.id;
    const alreadyApplied = job.already_applied;

    const workModeIcon = { 'Remote': '🌐', 'Hybrid': '🏢', 'On-site': '📍' };
    const levelColor = { 'Intermediate': '#F59E0B', 'Advanced': '#EF4444', 'Beginner': '#10B981' };

    return (
        <div
            className="animate-slide-up"
            style={{
                animationDelay: `${index * 0.07}s`,
                animationFillMode: 'backwards',
                background: hovered ? 'white' : 'var(--bg-card)',
                border: `1.5px solid ${hovered ? job.color + '80' : 'var(--border)'}`,
                borderRadius: 20,
                padding: '32px 24px 24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: hovered ? `0 12px 40px ${job.color}28` : 'var(--shadow)',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Subtle background gradient blob */}
            <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 140, height: 140, borderRadius: '0 20px 0 100%',
                background: `linear-gradient(135deg, ${job.color}18, ${job.color}06)`,
                transition: 'opacity 0.3s',
                opacity: hovered ? 1 : 0.6,
            }} />

            {/* Status badge top-right */}
            {statusBadge && (
                <div style={{ position: 'absolute', top: 16, right: 16 }}>{statusBadge}</div>
            )}

            {/* Big centered icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 22,
                    background: `linear-gradient(135deg, ${job.color}22, ${job.color}12)`,
                    border: `2px solid ${job.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 38,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    transform: hovered ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: hovered ? `0 8px 24px ${job.color}30` : 'none',
                }}>
                    {job.icon}
                </div>
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: 18, fontWeight: 700, marginBottom: 4,
                color: 'var(--text-primary)', textAlign: 'center', position: 'relative',
            }}>
                {job.title}
            </h3>

            {/* Experience pill */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 12px',
                    borderRadius: 20, background: job.color + '18', color: job.color,
                }}>
                    {job.experience}
                </span>
            </div>

            {/* Info grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, marginBottom: 20, position: 'relative',
            }}>
                {/* Salary */}
                <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 10,
                    padding: '10px 12px', gridColumn: '1 / -1',
                }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>💰 Salary Range</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{job.salary_range || 'Competitive'}</div>
                </div>

                {/* Work Mode */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Mode</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {workModeIcon[job.work_mode] || '🏙'} {job.work_mode || 'Flexible'}
                    </div>
                </div>

                {/* Openings */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Openings</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: job.color }}>
                        {job.openings ?? '—'} positions
                    </div>
                </div>

                {/* Job Type */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Type</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>💼 {job.job_type || 'Full-time'}</div>
                </div>

                {/* Assessment Level */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Assessment</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: levelColor[job.assessment_level] || '#3B82F6' }}>
                        ⚡ {job.assessment_level || 'Standard'}
                    </div>
                </div>
            </div>

            {/* Apply button */}
            <button
                onClick={onApply}
                disabled={isApplying}
                style={{
                    width: '100%', padding: '13px 20px',
                    borderRadius: 12, border: 'none', cursor: isApplying ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: 14,
                    transition: 'all 0.2s',
                    background: alreadyApplied
                        ? 'var(--bg-secondary)'
                        : `linear-gradient(135deg, ${job.color}, ${job.color}cc)`,
                    color: alreadyApplied ? 'var(--text-primary)' : 'white',
                    boxShadow: alreadyApplied ? 'none' : `0 4px 16px ${job.color}40`,
                    transform: hovered && !isApplying ? 'scale(1.02)' : 'scale(1)',
                    position: 'relative',
                    marginTop: 'auto',
                }}
            >
                {isApplying ? '⏳ Applying...' : alreadyApplied ? '▶ Continue Assessment →' : 'Apply & Start Assessment'}
            </button>
        </div>
    );
}
