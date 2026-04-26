import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function RecruiterDecisions() {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'shortlisted', 'rejected'
    const { showToast } = useToast();

    useEffect(() => {
        fetchDecisions();
    }, []);

    const fetchDecisions = async () => {
        try {
            const res = await api.get('/recruiter/decisions');
            setDecisions(res.data);
        } catch (err) {
            showToast('Failed to load decisions', 'error');
        } finally {
            setLoading(false);
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

    const filteredDecisions = decisions.filter(d => 
        filter === 'all' ? true : d.status === filter
    );

    const recColors = { 'Highly Recommended': 'badge-green', 'Recommended': 'badge-yellow', 'Not Recommended': 'badge-red' };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Decisions Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Review all your shortlisted and rejected candidates.</p>
                </div>
                
                <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('all')}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                    >
                        All ({decisions.length})
                    </button>
                    <button 
                        className={`btn ${filter === 'shortlisted' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => setFilter('shortlisted')}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                    >
                        Shortlisted ({decisions.filter(d => d.status === 'shortlisted').length})
                    </button>
                    <button 
                        className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => setFilter('rejected')}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                    >
                        Rejected ({decisions.filter(d => d.status === 'rejected' || d.disqualified).length})
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredDecisions.length === 0 ? (
                    <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>📂</p>
                        <p>No candidates found matching this filter.</p>
                    </div>
                ) : (
                    filteredDecisions.map((c, i) => (
                        <div key={c.id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards', overflow: 'hidden' }}>
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <div style={{
                                                width: 38, height: 38, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--accent-light), #E0E7FF)', color: 'var(--accent)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 600, fontSize: 14, boxShadow: '0 2px 4px rgba(79,70,229,0.1)'
                                            }}>
                                                {c.candidate_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{c.candidate_name}</h3>
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                    {c.candidate_email} • Applied for: <strong>{c.job_title}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                                            <span>Aptitude: <strong>{c.aptitude_score != null ? `${c.aptitude_score}%` : '—'}</strong></span>
                                            <span>Interview: <strong>{c.interview_score != null ? `${c.interview_score}%` : '—'}</strong></span>
                                            <span>Final: <strong style={{ color: 'var(--accent)' }}>{c.final_score != null ? `${c.final_score}%` : '—'}</strong></span>
                                            
                                            {c.recommendation && <span className={`badge ${recColors[c.recommendation] || ''}`}>{c.recommendation}</span>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {c.disqualified ? (
                                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#7f1d1d', color: '#fff' }}>
                                                ⛔ Disqualified
                                            </span>
                                        ) : (
                                            <span className={`badge ${c.status === 'shortlisted' ? 'badge-green' : 'badge-red'}`} style={{ textTransform: 'capitalize', padding: '4px 12px', fontSize: 13 }}>
                                                {c.status}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: 12, padding: '6px 12px' }}
                                        onClick={() => viewResume(c.candidate_id, c.candidate_name)}
                                    >
                                        📄 View Resume
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
