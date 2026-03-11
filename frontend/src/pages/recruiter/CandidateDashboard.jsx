import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function CandidateDashboard() {
    const { jobId } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [interviewDetail, setInterviewDetail] = useState(null);
    const [showRecording, setShowRecording] = useState(false);
    const [videoSpeed, setVideoSpeed] = useState(1);
    const [expandedLogsId, setExpandedLogsId] = useState(null);
    const { showToast } = useToast();


    useEffect(() => {
        api.get(`/recruiter/jobs/${jobId}/candidates`)
            .then(res => setCandidates(res.data))
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
            showToast(`Candidate ${action}!`);
            setCandidates(candidates.map(c => c.id === appId ? { ...c, status: action } : c));
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    const viewResume = async (candidateId, candidateName) => {
        try {
            const res = await api.get(`/recruiter/candidates/${candidateId}/resume`);
            const { resume_url, resume_filename } = res.data;
            // Open in new tab
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
        // Parse "MM:SS" or "HH:MM:SS" into seconds
        const parts = (relativeTime || '0:00').split(':').map(Number);
        const seconds = parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + (parts[1] || 0);

        // Ensure Q&A panel is open for this candidate
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
        // Show the recording player, then seek
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

    const recColors = { 'Highly Recommended': 'badge-green', 'Recommended': 'badge-yellow', 'Not Recommended': 'badge-red' };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading candidates...</div>;

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Candidate Evaluation</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{candidates.length} applicants — ranked by final score</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {candidates.map((c, i) => (
                    <div key={c.id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards', overflow: 'hidden' }}>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%',
                                            background: 'var(--accent-light)', color: 'var(--accent)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600, fontSize: 14,
                                        }}>
                                            {c.candidate_name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{c.candidate_name}</h3>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.candidate_email}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <span>Aptitude: <strong>{c.aptitude_score != null ? `${c.aptitude_score}%` : '—'}</strong></span>
                                        <span>Interview: <strong>{c.interview_score != null ? `${c.interview_score}%` : '—'}</strong></span>
                                        <span>Final: <strong style={{ color: 'var(--accent)' }}>{c.final_score != null ? `${c.final_score}%` : '—'}</strong></span>

                                        {/* Proctoring Data */}
                                        {c.proctoring_warnings?.length > 0 && (
                                            <span style={{
                                                color: 'var(--danger)',
                                                fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-secondary)'
                                            }}>
                                                ⚠️ AI Proctoring Alert
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {c.recommendation && <span className={`badge ${recColors[c.recommendation] || ''}`}>{c.recommendation}</span>}
                                    {c.disqualified ? (
                                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#7f1d1d', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            ⛔ Disqualified
                                        </span>
                                    ) : (
                                        <span className={`badge ${c.status === 'shortlisted' ? 'badge-green' : c.status === 'rejected' ? 'badge-red' : 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>
                                {c.disqualified && c.disqualify_reason && (
                                    <div style={{ marginTop: 6, fontSize: 12, color: '#991b1b', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🚨 <strong>Disqualification reason:</strong> {c.disqualify_reason}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: 12, padding: '6px 12px' }}
                                    onClick={() => viewResume(c.candidate_id, c.candidate_name)}
                                >
                                    📄 View Resume
                                </button>
                                {c.interview_score != null && (
                                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => viewInterview(c.id)}>
                                        {expandedId === c.id ? '▲ Hide Q&A' : '📋 View Q&A & Recording'}
                                    </button>
                                )}
                                {c.status === 'interview_done' && c.interview_score == null && (
                                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => viewInterview(c.id)}>
                                        {expandedId === c.id ? '▲ Hide Details' : '🎥 View Recording'}
                                    </button>
                                )}
                                {c.status !== 'shortlisted' && c.status !== 'rejected' && c.final_score != null && (
                                    <>
                                        <button className="btn btn-success" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => makeDecision(c.id, 'shortlisted')}>
                                            ✓ Shortlist
                                        </button>
                                        <button className="btn btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => makeDecision(c.id, 'rejected')}>
                                            ✗ Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>


                        {expandedId === c.id && interviewDetail && (
                            <div style={{ borderTop: '1px solid var(--border)', padding: 20, background: 'var(--bg-secondary)' }}>

                                {/* Video Recording Section */}
                                {interviewDetail.recording_b64 && (
                                    <div style={{ marginBottom: 28 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                🎥 Interview Recording
                                                {interviewDetail.recording_saved_at && (
                                                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                                                        saved {new Date(interviewDetail.recording_saved_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </h4>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {showRecording && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: 11, padding: '5px 10px', fontWeight: 700 }}
                                                        onClick={() => {
                                                            const speeds = [1, 1.5, 2];
                                                            const next = speeds[(speeds.indexOf(videoSpeed) + 1) % speeds.length];
                                                            setVideoSpeed(next);
                                                            const vid = document.getElementById(`interview-video-${c.id}`);
                                                            if (vid) vid.playbackRate = next;
                                                        }}
                                                    >
                                                        {videoSpeed}x Speed
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: 12, padding: '5px 12px' }}
                                                    onClick={() => setShowRecording(v => !v)}
                                                >
                                                    {showRecording ? '▲ Hide Recording' : '▶ Watch Recording'}
                                                </button>
                                            </div>
                                        </div>
                                        {showRecording && (
                                            <div style={{ background: '#0a0a0a', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid #222' }}>
                                                <video
                                                    id={`interview-video-${c.id}`}
                                                    controls
                                                    src={interviewDetail.recording_b64}
                                                    style={{ width: '100%', maxHeight: 450, display: 'block', background: '#000' }}
                                                    preload="metadata"
                                                >
                                                    Your browser does not support the video element.
                                                </video>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Proctoring Logs — always shown between recording and Q&A */}
                                {c.proctoring_warnings?.length > 0 && (
                                    <div style={{ marginBottom: 28, background: '#fff7f7', border: '1px solid #fecaca', borderRadius: 8, padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                                                🚨 AI Proctoring Logs <span style={{ fontWeight: 400, color: '#b91c1c', fontSize: 12 }}>({c.proctoring_warnings.length} events)</span>
                                            </h4>
                                            <button
                                                onClick={() => setExpandedLogsId(expandedLogsId === c.id ? null : c.id)}
                                                style={{ padding: '3px 12px', fontSize: 11, borderRadius: 20, border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                {expandedLogsId === c.id ? '▲ Collapse' : '▼ Expand Log'}
                                            </button>
                                        </div>
                                        {expandedLogsId === c.id && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                                                {c.proctoring_warnings.map((w, wi) => (
                                                    <div key={wi} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'white', borderRadius: 6, border: '1px solid #fee2e2' }}>
                                                        <button
                                                            onClick={() => jumpToTimestamp(c.id, w.relativeTime)}
                                                            title={`Jump to ${w.relativeTime} in recording`}
                                                            style={{
                                                                padding: '3px 9px', fontSize: 11, borderRadius: 20,
                                                                border: '1px solid #dc2626', background: '#dc2626',
                                                                color: '#fff', cursor: 'pointer', fontWeight: 600,
                                                                whiteSpace: 'nowrap', flexShrink: 0,
                                                            }}
                                                        >
                                                            ⏩ {w.relativeTime || '0:00'}
                                                        </button>
                                                        <span style={{ color: '#7f1d1d', lineHeight: 1.4 }}>{w.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Interview Q&A</h4>
                                {interviewDetail.questions.map((q, qi) => (
                                    <div key={qi} style={{ marginBottom: 16, padding: 14, background: 'white', borderRadius: 10 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                                            Q{qi + 1}: {q.question}
                                        </p>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                                            <strong>A:</strong> {q.answer || <em>No answer</em>}
                                        </p>
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                            <span className={`badge ${q.score >= 7 ? 'badge-green' : q.score >= 4 ? 'badge-yellow' : 'badge-red'}`}>
                                                Score: {q.score}/10
                                            </span>
                                            {q.feedback && <span style={{ color: 'var(--text-muted)' }}>{q.feedback}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {candidates.length === 0 && (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>📊</p>
                        <p>No applicants yet for this position</p>
                    </div>
                )}
            </div>
        </div>
    );
}
