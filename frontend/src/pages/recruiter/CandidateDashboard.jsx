import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function CandidateDashboard() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [interviewDetail, setInterviewDetail] = useState(null);
    const [showRecording, setShowRecording] = useState(false);
    const [videoSpeed, setVideoSpeed] = useState(1);
    const [expandedLogsId, setExpandedLogsId] = useState(null);
    const { showToast } = useToast();

    useEffect(() => {
        Promise.all([
            api.get(`/recruiter/jobs/${jobId}/candidates`),
            api.get('/recruiter/jobs'),
        ])
            .then(([candidatesRes, jobsRes]) => {
                setCandidates(candidatesRes.data);
                const job = jobsRes.data.find(j => j.id === jobId);
                if (job) setIsExpired(job.is_expired);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [jobId]);

    const viewInterview = async (appId) => {
        if (expandedId === appId) {
            setExpandedId(null);
            setInterviewDetail(null);
            setShowRecording(false);
            return;
        }
        try {
            const res = await api.get(`/recruiter/candidates/${appId}/interview`);
            setInterviewDetail(res.data);
            setExpandedId(appId);
        } catch {
            showToast('No interview record found', 'error');
        }
    };

    const makeDecision = async (appId, action) => {
        try {
            await api.post(`/recruiter/candidates/${appId}/decision`, { action });
            showToast(`Candidate ${action} successfully!`, 'success');
            setCandidates(candidates.map(c => c.id === appId ? { ...c, status: action } : c));
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error applying decision', 'error');
        }
    };

    const viewResume = async (candidateId, candidateName) => {
        try {
            const res = await api.get(`/recruiter/candidates/${candidateId}/resume`);
            const { resume_url, resume_filename } = res.data;
            const link = document.createElement('a');
            link.href = resume_url;
            link.download = resume_filename || `${candidateName}_resume`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            showToast('Resume not available for this candidate', 'error');
        }
    };

    const jumpToTimestamp = async (candidateId, relativeTime) => {
        const parts = (relativeTime || '0:00').split(':').map(Number);
        const seconds = parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + (parts[1] || 0);

        if (expandedId !== candidateId) {
            try {
                const res = await api.get(`/recruiter/candidates/${candidateId}/interview`);
                setInterviewDetail(res.data);
                setExpandedId(candidateId);
            } catch {
                showToast('No interview record found', 'error');
                return;
            }
        }
        setShowRecording(true);
        setTimeout(() => {
            const video = document.getElementById(`interview-video-${candidateId}`);
            if (video) {
                video.currentTime = seconds;
                video.play().catch(() => { });
                video.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 350);
    };

    const recColors = { 
        'Highly Recommended': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }, 
        'Recommended': { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }, 
        'Not Recommended': { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' } 
    };

    if (loading) return (
        <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--success)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading candidates...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const totalCount = candidates.length;
    const shortlistedCount = candidates.filter(c => c.status === 'shortlisted').length;
    const rejectedCount = candidates.filter(c => c.status === 'rejected' || c.disqualified).length;

    return (
        <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
            {/* Header Area */}
            <div style={{ 
                background: 'white', borderBottom: '1px solid var(--border)',
                padding: '40px 32px', marginBottom: 32
            }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <button 
                            onClick={() => navigate('/recruiter/jobs')} 
                            style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16, padding: 0 }}
                        >
                            ← Back to Jobs
                        </button>
                        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: '#1C1917', letterSpacing: '-0.5px' }}>
                            Candidate Pipeline
                        </h1>
                        <p style={{ color: '#57534E', fontSize: 16, margin: 0 }}>
                            Review {totalCount} applicant{totalCount !== 1 ? 's' : ''} ranked by AI score.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                        {[
                            { label: 'Total', count: totalCount, color: '#3B82F6', bg: '#EFF6FF' },
                            { label: 'Shortlisted', count: shortlistedCount, color: '#10B981', bg: '#ECFDF5' },
                            { label: 'Rejected', count: rejectedCount, color: '#EF4444', bg: '#FEF2F2' }
                        ].map(stat => (
                            <div key={stat.label} className="glass" style={{ background: stat.bg, border: `1px solid ${stat.color}30`, padding: '12px 20px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90, boxShadow: 'var(--shadow-sm)' }}>
                                <span style={{ fontSize: 24, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.count}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: stat.color, marginTop: 4, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expired Job Banner */}
            {isExpired && (
                <div style={{
                    maxWidth: 1000, margin: '0 auto 24px', padding: '0 32px'
                }}>
                    <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
                        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <span style={{ fontSize: 20 }}>⛔</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#991B1B', fontSize: 14 }}>This job has expired</p>
                            <p style={{ margin: 0, color: '#B91C1C', fontSize: 13 }}>You are viewing a closed listing in read-only mode. No new decisions can be made.</p>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px 64px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {candidates.map((c, i) => (
                        <div key={c.id} className="card animate-slide-up" style={{ 
                            borderRadius: 16, border: '1px solid var(--border)', 
                            boxShadow: expandedId === c.id ? 'var(--shadow-lg)' : 'var(--shadow)',
                            animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards', overflow: 'hidden',
                            borderColor: expandedId === c.id ? 'var(--accent)' : 'var(--border)'
                        }}>
                            {/* Candidate Header Summary */}
                            <div style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                    
                                    {/* Left: Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 12,
                                                background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', color: '#475569',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 18, border: '1px solid #CBD5E1'
                                            }}>
                                                {c.candidate_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px', color: '#1E293B' }}>{c.candidate_name}</h3>
                                                <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{c.candidate_email}</p>
                                            </div>
                                        </div>

                                        {/* Scores Block */}
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px' }}>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Aptitude</span>
                                                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{c.aptitude_score != null ? `${c.aptitude_score}%` : '—'}</span>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px' }}>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Interview</span>
                                                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{c.interview_score != null ? `${c.interview_score}%` : '—'}</span>
                                            </div>
                                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 16px' }}>
                                                <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>Final Match</span>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8' }}>{c.final_score != null ? `${c.final_score}%` : '—'}</span>
                                            </div>
                                        </div>

                                        {/* Proctoring Badges */}
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {c.tab_switches > 0 && (
                                                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    👀 {c.tab_switches} Tab Switch{c.tab_switches !== 1 ? 'es' : ''}
                                                </span>
                                            )}
                                            {c.proctoring_warnings?.length > 0 && (
                                                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ⚠️ {c.proctoring_warnings.length} Proctor Alert{c.proctoring_warnings.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Status & Actions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {c.recommendation && recColors[c.recommendation] && (
                                                <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: recColors[c.recommendation].bg, color: recColors[c.recommendation].text, border: `1px solid ${recColors[c.recommendation].border}` }}>
                                                    {c.recommendation}
                                                </span>
                                            )}
                                            {c.disqualified ? (
                                                <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: '#7F1D1D', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>🚫</span> Disqualified
                                                </span>
                                            ) : (
                                                <span className={`badge ${c.status === 'shortlisted' ? 'badge-green' : c.status === 'rejected' ? 'badge-red' : 'badge-blue'}`} style={{ textTransform: 'capitalize', fontSize: 12, padding: '6px 14px' }}>
                                                    {c.status?.replace(/_/g, ' ')}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {c.disqualified && c.disqualify_reason && (
                                            <div style={{ fontSize: 12, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', maxWidth: 300, textAlign: 'right' }}>
                                                <strong>Reason:</strong> {c.disqualify_reason}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <button className="btn" style={{ fontSize: 13, background: 'white', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 600, padding: '8px 16px', borderRadius: 8 }} onClick={() => viewResume(c.candidate_id, c.candidate_name)}>
                                                📄 Resume
                                            </button>
                                            
                                            {(c.interview_score != null || c.status === 'interview_done') && (
                                                <button className="btn" style={{ fontSize: 13, background: expandedId === c.id ? '#F1F5F9' : '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600, padding: '8px 16px', borderRadius: 8, transition: 'all 0.2s' }} onClick={() => viewInterview(c.id)}>
                                                    {expandedId === c.id ? '▲ Hide Details' : '🎥 Review Interview'}
                                                </button>
                                            )}

                                            {!isExpired && c.status !== 'shortlisted' && c.status !== 'rejected' && c.final_score != null && (
                                                <>
                                                    <button className="btn" style={{ fontSize: 13, background: '#10B981', border: 'none', color: 'white', fontWeight: 600, padding: '8px 16px', borderRadius: 8 }} onClick={() => { if (window.confirm('Are you sure you want to shortlist this candidate?')) makeDecision(c.id, 'shortlisted'); }}>
                                                        ✓ Shortlist
                                                    </button>
                                                    <button className="btn" style={{ fontSize: 13, background: 'white', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 600, padding: '8px 16px', borderRadius: 8 }} onClick={() => { if (window.confirm('Are you sure you want to reject this candidate?')) makeDecision(c.id, 'rejected'); }}>
                                                        ✗ Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details Section */}
                            {expandedId === c.id && interviewDetail && (
                                <div style={{ borderTop: '1px solid #E2E8F0', padding: 32, background: '#F8FAFC', animation: 'fadeIn 0.3s' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
                                        
                                        {/* Left Side: Video & Q&A */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                            {/* Video Player */}
                                            {interviewDetail.recording_b64 && (
                                                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            🎥 Interview Recording
                                                        </h4>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            {showRecording && (
                                                                <button
                                                                    onClick={() => {
                                                                        const speeds = [1, 1.5, 2];
                                                                        const next = speeds[(speeds.indexOf(videoSpeed) + 1) % speeds.length];
                                                                        setVideoSpeed(next);
                                                                        const vid = document.getElementById(`interview-video-${c.id}`);
                                                                        if (vid) vid.playbackRate = next;
                                                                    }}
                                                                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: '#E2E8F0', color: '#334155', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    {videoSpeed}x Speed
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setShowRecording(v => !v)}
                                                                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: '#3B82F6', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                                            >
                                                                {showRecording ? '▲ Hide Video' : '▶ Play Video'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {showRecording && (
                                                        <div style={{ background: '#0a0a0a', borderRadius: 8, overflow: 'hidden', border: '1px solid #1E293B' }}>
                                                            <video
                                                                id={`interview-video-${c.id}`}
                                                                controls
                                                                src={interviewDetail.recording_b64}
                                                                style={{ width: '100%', maxHeight: 400, display: 'block', background: '#000' }}
                                                                preload="metadata"
                                                            >
                                                                Your browser does not support the video element.
                                                            </video>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Q&A List */}
                                            <div>
                                                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0F172A' }}>Questions & Responses</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    {interviewDetail.questions.map((q, qi) => (
                                                        <div key={qi} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                                            <div style={{ background: '#F1F5F9', padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                                                                <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: 0, lineHeight: 1.5 }}>
                                                                    <span style={{ color: '#3B82F6', marginRight: 6 }}>Q{qi + 1}.</span>{q.question}
                                                                </p>
                                                            </div>
                                                            <div style={{ padding: '16px' }}>
                                                                <p style={{ fontSize: 14, color: '#475569', margin: '0 0 16px', lineHeight: 1.6 }}>
                                                                    {q.answer || <em style={{ color: '#94A3B8' }}>No answer provided</em>}
                                                                </p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                                                                    <div style={{ 
                                                                        background: q.score >= 7 ? '#D1FAE5' : q.score >= 4 ? '#FEF3C7' : '#FEE2E2',
                                                                        color: q.score >= 7 ? '#065F46' : q.score >= 4 ? '#92400E' : '#991B1B',
                                                                        padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700
                                                                    }}>
                                                                        {q.score}/10
                                                                    </div>
                                                                    {q.feedback && <div style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic', flex: 1 }}>"{q.feedback}"</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Proctoring Logs  */}
                                        <div>
                                            <div style={{ position: 'sticky', top: 24, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                                                <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    AI Proctor Notes
                                                </h4>
                                                
                                                {(!c.proctoring_warnings || c.proctoring_warnings.length === 0) && c.tab_switches === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '32px 16px', background: '#F8FAFC', borderRadius: 8 }}>
                                                        <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🛡️</span>
                                                        <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500, margin: 0 }}>Clean assessment. No anomalies detected.</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        
                                                        {c.tab_switches > 0 && (
                                                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 16 }}>
                                                                <h5 style={{ margin: '0 0 8px', fontSize: 14, color: '#B45309' }}>Browser Activity</h5>
                                                                <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>The candidate switched tabs <strong>{c.tab_switches} time{c.tab_switches !== 1 ? 's' : ''}</strong> during the assessment.</p>
                                                            </div>
                                                        )}

                                                        {c.proctoring_warnings?.length > 0 && (
                                                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 16 }}>
                                                                <h5 style={{ margin: '0 0 12px', fontSize: 14, color: '#B91C1C', display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span>Video Anomalies ({c.proctoring_warnings.length})</span>
                                                                </h5>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                                                                    {c.proctoring_warnings.map((w, wi) => (
                                                                        <div key={wi} style={{ background: 'white', border: '1px solid #FEE2E2', borderRadius: 6, padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                                                                            <button
                                                                                onClick={() => jumpToTimestamp(c.id, w.relativeTime)}
                                                                                title="Jump to time"
                                                                                style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                            >
                                                                                {w.relativeTime || '0:00'}
                                                                            </button>
                                                                            <span style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.4 }}>{w.message}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {candidates.length === 0 && (
                        <div style={{ 
                            padding: '64px 24px', textAlign: 'center', background: 'white', 
                            borderRadius: 16, border: '1px dashed #D6D3D1', marginTop: 20 
                        }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>📊</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1C1917' }}>No applicants yet</h3>
                            <p style={{ color: '#57534E', maxWidth: 400, margin: '0 auto' }}>
                                Candidates who complete the AI assessment will appear here ranked by their scores.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
