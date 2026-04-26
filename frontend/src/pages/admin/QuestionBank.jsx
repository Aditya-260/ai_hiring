import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function QuestionBank() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [form, setForm] = useState({ text: '', options: ['', '', '', ''], correct_answer: '', category: 'technical', difficulty: 'medium', role_tag: '' });
    const { showToast } = useToast();

    const load = () => api.get('/admin/questions').then(res => setQuestions(res.data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, options: form.options.filter(Boolean) };
        try {
            if (editId) {
                await api.put(`/admin/questions/${editId}`, payload);
                showToast('Question updated');
            } else {
                await api.post('/admin/questions', payload);
                showToast('Question created');
            }
            setShowForm(false);
            setEditId(null);
            setForm({ text: '', options: ['', '', '', ''], correct_answer: '', category: 'technical', difficulty: 'medium', role_tag: '' });
            load();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error', 'error');
        }
    };

    const deleteQ = async (id) => {
        try {
            await api.delete(`/admin/questions/${id}`);
            showToast('Question deleted');
            load();
        } catch {
            showToast('Error', 'error');
        } finally {
            setConfirmId(null);
        }
    };

    const startEdit = (q) => {
        setForm({ text: q.text, options: [...q.options, '', '', '', ''].slice(0, 4), correct_answer: q.correct_answer, category: q.category || 'technical', difficulty: q.difficulty || 'medium', role_tag: q.role_tag || '' });
        setEditId(q.id);
        setShowForm(true);
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Question Bank</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage {questions.length} assessment questions</p>
                </div>
                <button 
                    style={{
                        padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                        background: showForm ? 'white' : 'var(--text-primary)',
                        color: showForm ? 'var(--text-primary)' : 'white',
                        border: showForm ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: showForm ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ text: '', options: ['', '', '', ''], correct_answer: '', category: 'technical', difficulty: 'medium', role_tag: '' }); }}
                >
                    {showForm ? 'Cancel' : '+ Add Question'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Question Text *</label>
                            <textarea className="input" rows={2} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {form.options.map((opt, idx) => (
                                <div key={idx}>
                                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Option {idx + 1} *</label>
                                    <input className="input" value={opt} onChange={e => { const o = [...form.options]; o[idx] = e.target.value; setForm({ ...form, options: o }); }} required />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Correct Answer *</label>
                                <select className="input" value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })} required>
                                    <option value="">Select</option>
                                    {form.options.filter(Boolean).map((o, i) => <option key={i} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Category</label>
                                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="technical">Technical</option>
                                    <option value="logical">Logical</option>
                                    <option value="quantitative">Quantitative</option>
                                    <option value="verbal">Verbal</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>Difficulty</label>
                                <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ marginTop: 16 }}>
                        {editId ? 'Update Question' : 'Add Question'}
                    </button>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                {questions.map((q, i) => (
                    <div key={q.id} style={{ 
                        background: 'white', borderRadius: 16, padding: '20px 24px', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        animationDelay: `${i * 0.03}s`, animationFillMode: 'both',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }} 
                    className="animate-slide-up"
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)';
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                                        background: '#EFF6FF', color: '#2563EB'
                                    }}>{q.category}</span>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                                        background: q.difficulty === 'easy' ? '#F0FDF4' : q.difficulty === 'hard' ? '#FEF2F2' : '#FFFBEB',
                                        color: q.difficulty === 'easy' ? '#16A34A' : q.difficulty === 'hard' ? '#DC2626' : '#D97706'
                                    }}>{q.difficulty}</span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)', lineHeight: 1.4 }}>{q.text}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {q.options.map((o, idx) => (
                                        <div key={idx} style={{
                                            padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                                            background: o === q.correct_answer ? '#ECFDF5' : 'var(--bg-secondary)',
                                            color: o === q.correct_answer ? '#059669' : 'var(--text-secondary)',
                                            border: `1px solid ${o === q.correct_answer ? '#A7F3D0' : 'transparent'}`,
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}>
                                            <div style={{ 
                                                width: 20, height: 20, borderRadius: '50%', 
                                                background: o === q.correct_answer ? '#059669' : 'white',
                                                color: o === q.correct_answer ? 'white' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 700, border: o === q.correct_answer ? 'none' : '1px solid var(--border)'
                                            }}>
                                                {o === q.correct_answer ? '✓' : String.fromCharCode(65 + idx)}
                                            </div>
                                            {o}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button 
                                    style={{ 
                                        background: 'white', border: '1px solid var(--border)', borderRadius: 8,
                                        padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        color: 'var(--text-secondary)', transition: 'all 0.2s', width: 80
                                    }} 
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                    onClick={() => startEdit(q)}
                                >Edit</button>
                                {confirmId === q.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px' }}>
                                        <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>Delete permanently?</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-danger" style={{ flex: 1, padding: '4px', fontSize: 11, borderRadius: 6 }} onClick={() => deleteQ(q.id)}>Yes</button>
                                            <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: 11, borderRadius: 6 }} onClick={() => setConfirmId(null)}>No</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        style={{ 
                                            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                                            padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            color: '#DC2626', transition: 'all 0.2s', width: 80
                                        }} 
                                        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                        onClick={() => setConfirmId(q.id)}
                                    >Delete</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
