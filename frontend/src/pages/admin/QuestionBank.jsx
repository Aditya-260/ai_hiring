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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Question Bank</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{questions.length} questions</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ text: '', options: ['', '', '', ''], correct_answer: '', category: 'technical', difficulty: 'medium', role_tag: '' }); }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.map((q, i) => (
                    <div key={q.id} className="card animate-slide-up" style={{ padding: 16, animationDelay: `${i * 0.03}s`, animationFillMode: 'backwards' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{q.text}</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {q.options.map((o, idx) => (
                                        <span key={idx} className="badge" style={{
                                            background: o === q.correct_answer ? 'var(--success-light)' : 'var(--bg-secondary)',
                                            color: o === q.correct_answer ? 'var(--success)' : 'var(--text-secondary)',
                                            fontSize: 11,
                                        }}>
                                            {o === q.correct_answer ? '✓ ' : ''}{o}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <span className="badge badge-blue" style={{ fontSize: 11 }}>{q.category}</span>
                                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 11 }}>{q.difficulty}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => startEdit(q)}>Edit</button>
                                {confirmId === q.id ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '3px 8px' }}>
                                        <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>Sure?</span>
                                        <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => deleteQ(q.id)}>Yes</button>
                                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setConfirmId(null)}>No</button>
                                    </div>
                                ) : (
                                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmId(q.id)}>Delete</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
