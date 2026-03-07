import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function CandidateProfile() {
    const { user, setUser } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', experience_years: 0, skills: '' });
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        api.get('/candidate/profile')
            .then(res => {
                setProfile(res.data);
                setForm({
                    name: res.data.name || '',
                    phone: res.data.phone || '',
                    experience_years: res.data.experience_years || 0,
                    skills: (res.data.skills || []).join(', '),
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('/candidate/profile', {
                name: form.name,
                phone: form.phone || null,
                experience_years: parseInt(form.experience_years) || 0,
                skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            });
            showToast('Profile updated!');
            setEditing(false);
            // Refresh profile
            const res = await api.get('/candidate/profile');
            setProfile(res.data);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error updating profile', 'error');
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
            const res = await api.get('/candidate/profile');
            setProfile(res.data);
        } catch {
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveResume = async () => {
        if (!window.confirm('Remove your uploaded resume?')) return;
        setRemoving(true);
        try {
            await api.delete('/candidate/resume');
            showToast('Resume removed');
            const res = await api.get('/candidate/profile');
            setProfile(res.data);
        } catch {
            showToast('Failed to remove resume', 'error');
        } finally {
            setRemoving(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>My Profile</h1>

            <div className="card animate-fade-in" style={{ padding: 28 }}>
                {/* Avatar + Name header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 22,
                    }}>
                        {profile?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{profile?.name}</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile?.email}</p>
                    </div>
                </div>

                {!editing ? (
                    <>
                        {/* View mode */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Phone</p>
                                <p style={{ fontSize: 14, fontWeight: 500 }}>{profile?.phone || '—'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Experience</p>
                                <p style={{ fontSize: 14, fontWeight: 500 }}>{profile?.experience_years || 0} years</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Skills</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {profile?.skills?.length > 0
                                        ? profile.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)
                                        : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No skills added</span>
                                    }
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Resume</p>
                                {profile?.resume_url ? (
                                    <span className="badge badge-green">✓ Resume uploaded</span>
                                ) : (
                                    <span className="badge badge-yellow">No resume uploaded</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
                                Edit Profile
                            </button>
                            <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: 13 }}>
                                {uploading ? 'Uploading...' : '📄 Upload Resume'}
                                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} style={{ display: 'none' }} />
                            </label>
                            {profile?.resume_url && (
                                <button
                                    onClick={handleRemoveResume}
                                    disabled={removing}
                                    style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e53e3e', background: 'transparent', color: '#e53e3e', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                                >
                                    {removing ? 'Removing...' : '🗑 Remove Resume'}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Edit mode */}
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Full Name</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Phone</label>
                                    <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Experience (years)</label>
                                    <input className="input" type="number" min="0" max="30" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Skills (comma separated)</label>
                                <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, SQL" />
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button className="btn btn-primary" type="submit" style={{ fontSize: 13 }}>Save Changes</button>
                                <button className="btn btn-secondary" type="button" style={{ fontSize: 13 }} onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
