import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function AssessmentFlow() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [phase, setPhase] = useState('intro'); // intro, aptitude, aptitude_result, interview, interview_result
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [result, setResult] = useState(null);
    const [interviewQs, setInterviewQs] = useState([]);
    const [interviewAnswers, setInterviewAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [forceSubmit, setForceSubmit] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('idle'); // idle | recording | uploading | done | error

    // Proctoring State
    const [tabWarnings, setTabWarnings] = useState(0);
    const [proctoringWarnings, setProctoringWarnings] = useState([]);
    const proctoringEventSourceRef = useRef(null);
    const timerRef = useRef(null);

    // Recording refs
    const mediaRecorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);
    const videoPreviewRef = useRef(null); // live camera preview element
    const recordingStartTimeRef = useRef(null); // used to calculate relative video timestamps

    // Speech state
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const recognitionRef = useRef(null);


    // Anti-cheating: tab switch detection
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && (phase === 'aptitude' || phase === 'interview')) {
                setTabWarnings(w => {
                    const newW = w + 1;

                    if (phase === 'aptitude') {
                        if (newW >= 3) {
                            showToast('🚨 Tab switch limit reached during Aptitude Test! You are disqualified.', 'error');
                            setProctoringWarnings(prev => [...prev, { type: 'danger', message: 'Disqualified: Exceeded allowed tab switches (3) during Aptitude test.' }]);
                            setPhase('disqualified');
                            setForceSubmit('disqualify_aptitude');
                        } else {
                            showToast(`⚠️ Warning ${newW}/3: Tab switch detected! Reaching 3 will disqualify you.`, 'error');
                        }
                    } else if (phase === 'interview') {
                        showToast('🚨 Tab switch detected during Interview! You are disqualified.', 'error');
                        setProctoringWarnings(prev => [...prev, { type: 'danger', message: 'Disqualified: Tab switch detected during Interview.' }]);
                        setPhase('disqualified');
                        setForceSubmit('disqualify_interview');
                    }
                    return newW;
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [phase, showToast]);



    // Anti-cheating: disable copy-paste
    useEffect(() => {
        const prevent = (e) => {
            if (phase === 'aptitude' || phase === 'interview') {
                e.preventDefault();
                showToast('Copy/paste is disabled during assessment', 'error');
            }
        };
        document.addEventListener('copy', prevent);
        document.addEventListener('paste', prevent);
        return () => {
            document.removeEventListener('copy', prevent);
            document.removeEventListener('paste', prevent);
        };
    }, [phase, showToast]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    if (phase === 'aptitude') submitAptitude();
                    if (phase === 'interview') submitInterview();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // Anti-cheating: Live Proctoring Warnings Stream
    useEffect(() => {
        if (phase === 'interview') {
            // Initiate proctoring tracking on the backend (using a generic email/id for now)
            fetch('http://127.0.0.1:5000/set_active_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: `candidate_${jobId}` })
            }).catch(e => console.error(e));

            // Connect to real-time proctoring stream
            const eventSource = new EventSource('http://127.0.0.1:5000/warnings_feed');
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type !== "none" && data.type !== "heartbeat") {
                    // Calculate relative timestamp based on recording start time
                    if (recordingStartTimeRef.current) {
                        const secondsSinceStart = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                        const mins = Math.floor(secondsSinceStart / 60);
                        const secs = secondsSinceStart % 60;
                        data.relativeTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    } else {
                        data.relativeTime = '00:00';
                    }

                    setProctoringWarnings(prev => [...prev, data]);

                    if (data.type === 'danger') {
                        showToast(`🚨 PROCTOR ALERT: ${data.message}`, 'error');
                    } else if (data.type === 'warning') {
                        showToast(`⚠️ PROCTOR WARNING: ${data.message}`, 'error');
                    }
                }
            };
            proctoringEventSourceRef.current = eventSource;

            return () => {
                if (proctoringEventSourceRef.current) {
                    proctoringEventSourceRef.current.close();
                }
            };
        }
    }, [phase, jobId, showToast]);

    // ── Recording: start when interview begins, stop on phase change ──
    useEffect(() => {
        if (phase === 'interview') {
            startRecording();
        }
        return () => {
            // Cleanup on unmount or phase change away from interview
            if (phase !== 'interview') stopRecording();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const startRecording = async () => {
        try {
            // Only request audio from the browser, avoiding camera conflict with OpenCV server
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
            });
            recordingChunksRef.current = [];

            // Setup a hidden canvas to capture the OpenCV feed from the img element
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            let drawFrameId;
            const drawFrame = () => {
                if (videoPreviewRef.current && videoPreviewRef.current.complete && videoPreviewRef.current.naturalWidth > 0) {
                    try {
                        ctx.drawImage(videoPreviewRef.current, 0, 0, canvas.width, canvas.height);
                    } catch (e) { }
                }
                drawFrameId = requestAnimationFrame(drawFrame);
            };
            drawFrameId = requestAnimationFrame(drawFrame);

            const videoStream = canvas.captureStream(15);
            const combinedStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                ...audioStream.getAudioTracks()
            ]);
            recordingStreamRef.current = combinedStream;

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
                    ? 'video/webm;codecs=vp8,opus'
                    : 'video/webm';

            const recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 150_000,
                audioBitsPerSecond: 32_000,
            });

            recorder.drawFrameId = drawFrameId;
            recorder.audioStream = audioStream;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
            };
            recorder.start(5000);
            mediaRecorderRef.current = recorder;
            recordingStartTimeRef.current = Date.now();
            setRecordingStatus('recording');
        } catch (err) {
            console.warn('Recording unavailable:', err);
            setRecordingStatus('error');
        }
    };


    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                if (mediaRecorderRef.current.drawFrameId) cancelAnimationFrame(mediaRecorderRef.current.drawFrameId);
                if (mediaRecorderRef.current.audioStream) mediaRecorderRef.current.audioStream.getTracks().forEach(t => t.stop());
                mediaRecorderRef.current.stop();
            }
        } catch (_) { /* ignore */ }
        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach(t => t.stop());
            recordingStreamRef.current = null;
        }
    };

    const uploadRecording = async () => {
        if (!recordingChunksRef.current || recordingChunksRef.current.length === 0) return;
        setRecordingStatus('uploading');
        try {
            const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
            const b64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            await api.post(`/candidate/interview/${jobId}/save-recording`, { recording_b64: b64 });
            setRecordingStatus('done');
        } catch (err) {
            console.error('Failed to upload recording:', err);
            setRecordingStatus('error');
        }
    };

    // ── Speech-to-Text: capture spoken answer ────────────────────────────
    const currentQRef = useRef(0);
    useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);

    const initRecognition = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setSpeechSupported(false); return null; }
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;
        return rec;
    };

    const startListening = () => {
        stopListening();
        const rec = initRecognition();
        if (!rec) return;
        rec.onresult = (e) => {
            let finalPiece = '';
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) { finalPiece += t + ' '; }
                else { interim += t; }
            }
            if (finalPiece) {
                setInterviewAnswers(prev => {
                    const qId = interviewQs[currentQRef.current]?.question_id;
                    if (!qId) return prev;
                    const existing = (prev[qId] || '').trimEnd();
                    return { ...prev, [qId]: existing ? existing + ' ' + finalPiece.trim() : finalPiece.trim() };
                });
            }
            setLiveTranscript(interim);
        };
        rec.onend = () => { setIsListening(false); setLiveTranscript(''); };
        rec.onerror = (e) => { if (e.error !== 'no-speech') console.warn('STT:', e.error); setIsListening(false); };
        try { rec.start(); recognitionRef.current = rec; setIsListening(true); } catch (_) { }
    };

    const stopListening = () => {
        try { recognitionRef.current?.stop(); } catch (_) { }
        recognitionRef.current = null;
        setIsListening(false);
        setLiveTranscript('');
    };

    // Auto-listen continuously throughout the interview phase
    useEffect(() => {
        if (phase === 'interview' && speechSupported && !isListening) {
            startListening();
        }
    }, [phase, speechSupported, isListening, startListening]);

    // Cleanup speech on unmount
    useEffect(() => () => { stopListening(); }, []); // eslint-disable-line

    // Helper: auto-calculate cheating percentage
    const calculateCheatingProbability = (warningList, tabs) => {
        let prob = (tabs * 15) + (warningList.length * 10);
        return Math.min(prob, 100);
    };

    const submitAllWarningsToBackend = async () => {
        try {
            await api.post(`/candidate/assessment/${jobId}/warnings`, {
                warnings: proctoringWarnings,
                cheating_probability: calculateCheatingProbability(proctoringWarnings, tabWarnings)
            });
        } catch (e) {
            console.error("Failed to save warnings", e);
        }
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Start aptitude
    const startAptitude = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/candidate/assessment/${jobId}`);
            setQuestions(res.data.questions);
            setTimeLeft(res.data.time_limit_minutes * 60);
            setPhase('aptitude');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to load', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Submit aptitude
    const submitAptitude = useCallback(async () => {
        setLoading(true);
        try {
            clearInterval(timerRef.current);
            const res = await api.post(`/candidate/assessment/${jobId}/submit`, { answers });
            setResult(res.data);
            setPhase('aptitude_result');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Submission failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [answers, jobId, showToast]);

    // Start interview
    const startInterview = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/candidate/interview/${jobId}`);
            setInterviewQs(res.data.questions);
            setTimeLeft(res.data.time_limit_minutes * 60);
            setCurrentQ(0);
            setPhase('interview');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to load interview', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Submit interview
    const submitInterview = useCallback(async () => {
        setLoading(true);
        try {
            clearInterval(timerRef.current);
            if (proctoringEventSourceRef.current) proctoringEventSourceRef.current.close();

            // Stop mic
            stopListening();

            // Stop recorder and wait for the final ondataavailable event to fire
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                await new Promise(resolve => {
                    mediaRecorderRef.current.onstop = resolve;
                    if (mediaRecorderRef.current.drawFrameId) cancelAnimationFrame(mediaRecorderRef.current.drawFrameId);
                    if (mediaRecorderRef.current.audioStream) mediaRecorderRef.current.audioStream.getTracks().forEach(t => t.stop());
                    mediaRecorderRef.current.stop();
                });
            }
            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach(t => t.stop());
                recordingStreamRef.current = null;
            }

            // First submit answers
            const formatted = interviewQs.map(q => ({
                question_id: q.question_id,
                question: q.question,
                answer: interviewAnswers[q.question_id] || '',
            }));
            const res = await api.post(`/candidate/interview/${jobId}/submit`, { answers: formatted });

            // Then submit warnings gathered across both aptitude and interview
            await submitAllWarningsToBackend();

            // Upload the video recording
            await uploadRecording();

            setResult(res.data);
            setPhase('interview_result');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Submission failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [interviewAnswers, interviewQs, jobId, showToast, proctoringWarnings, tabWarnings]);

    // Silent background save used when candidate is disqualified (tab switch).
    // Does NOT change phase — the 'disqualified' screen stays shown.
    const disqualifyInterview = useCallback(async () => {
        try {
            stopListening();

            // Stop recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                await new Promise(resolve => {
                    mediaRecorderRef.current.onstop = resolve;
                    if (mediaRecorderRef.current.drawFrameId) cancelAnimationFrame(mediaRecorderRef.current.drawFrameId);
                    if (mediaRecorderRef.current.audioStream) mediaRecorderRef.current.audioStream.getTracks().forEach(t => t.stop());
                    mediaRecorderRef.current.stop();
                });
            }
            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach(t => t.stop());
                recordingStreamRef.current = null;
            }

            // Submit whatever answers were given so far
            const formatted = interviewQs.map(q => ({
                question_id: q.question_id,
                question: q.question,
                answer: interviewAnswers[q.question_id] || '',
            }));
            await api.post(`/candidate/interview/${jobId}/submit`, { answers: formatted }).catch(() => { });

            // Save warnings + recording silently
            await submitAllWarningsToBackend();
            await uploadRecording();
        } catch (_) {
            // Silent — candidate already sees disqualified screen
        }
    }, [interviewAnswers, interviewQs, jobId, proctoringWarnings, tabWarnings]);

    // Silent background save used when candidate is disqualified (tab switch) during Aptitude.
    const disqualifyAptitude = useCallback(async () => {
        try {
            clearInterval(timerRef.current);
            await api.post(`/candidate/assessment/${jobId}/submit`, { answers }).catch(() => { });
            await submitAllWarningsToBackend();
        } catch (_) {
            // Silent
        }
    }, [answers, jobId, proctoringWarnings, tabWarnings]);

    // Reliable Auto-Submit via State
    useEffect(() => {
        if (forceSubmit === 'aptitude') { submitAptitude(); setForceSubmit(null); }
        if (forceSubmit === 'interview') { submitInterview(); setForceSubmit(null); }
        if (forceSubmit === 'disqualify_aptitude') { disqualifyAptitude(); setForceSubmit(null); }
        if (forceSubmit === 'disqualify_interview') { disqualifyInterview(); setForceSubmit(null); }
    }, [forceSubmit, submitAptitude, submitInterview, disqualifyAptitude, disqualifyInterview]);

    // ── Render Phases ──

    if (phase === 'intro') {
        return (
            <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
                <div className="card animate-fade-in" style={{ padding: 36, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Assessment</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                        This assessment has two parts:<br />
                        <strong>1. Aptitude Test</strong> — 20 MCQ questions (30 min, 40% cutoff)<br />
                        <strong>2. AI Interview</strong> — 5 role-specific questions (45 min)
                    </p>
                    <div className="card" style={{ padding: 16, marginBottom: 24, background: 'var(--warning-light)', border: 'none' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            ⚠️ <strong>Anti-cheating measures active:</strong> Tab switching is monitored, copy-paste disabled, timer enforced.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={startAptitude} disabled={loading} style={{ padding: '12px 32px' }}>
                        {loading ? 'Loading...' : 'Begin Aptitude Test'}
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'aptitude') {
        const q = questions?.[currentQ];
        const totalQ = questions?.length || 0;
        return (
            <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {currentQ + 1} of {totalQ}</span>
                        <div style={{ height: 4, width: 200, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${totalQ ? ((currentQ + 1) / totalQ) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                    </div>
                    <div className="badge badge-red" style={{ fontSize: 14, fontWeight: 600, padding: '6px 14px' }}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                </div>

                {tabWarnings > 0 && (
                    <div style={{ padding: '8px 14px', background: 'var(--danger-light)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
                        ⚠️ Tab switch warnings: {tabWarnings}/3
                    </div>
                )}

                <div className="card" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>{q?.text}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {q?.options?.map((opt, idx) => (
                            <label
                                key={idx}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 10,
                                    border: `2px solid ${q?.id && answers[q.id] === opt ? 'var(--accent)' : 'var(--border)'}`,
                                    background: q?.id && answers[q.id] === opt ? 'var(--accent-light)' : 'white',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name={`q-${q?.id || 'unknown'}`}
                                    checked={q?.id ? answers[q.id] === opt : false}
                                    onChange={() => q?.id && setAnswers({ ...answers, [q.id]: opt })}
                                    style={{ accentColor: 'var(--accent)' }}
                                />
                                <span style={{ fontSize: 14 }}>{opt}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        <button
                            className="btn btn-secondary"
                            disabled={currentQ === 0}
                            onClick={() => setCurrentQ(c => c - 1)}
                        >
                            ← Previous
                        </button>
                        {currentQ < totalQ - 1 ? (
                            <button className="btn btn-primary" onClick={() => setCurrentQ(c => c + 1)}>
                                Next →
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={submitAptitude} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Test'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'aptitude_result') {
        return (
            <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px' }}>
                <div className="card animate-fade-in" style={{ padding: 36, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>{result?.passed ? '✅' : '❌'}</div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
                        {result?.passed ? 'Aptitude Test Passed!' : 'Aptitude Test Not Passed'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        Score: {result?.correct}/{result?.total} ({result?.score}%)
                    </p>
                    {result?.passed ? (
                        <button className="btn btn-primary" onClick={startInterview} disabled={loading} style={{ padding: '12px 32px' }}>
                            {loading ? 'Loading...' : 'Proceed to AI Interview →'}
                        </button>
                    ) : (
                        <button className="btn btn-secondary" onClick={() => navigate('/candidate/jobs')} style={{ padding: '12px 32px' }}>
                            Back to Jobs
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (phase === 'interview') {
        const q = interviewQs[currentQ];
        const currentAnswer = interviewAnswers[q?.question_id] || '';
        return (
            <div style={{ maxWidth: 740, margin: '30px auto', padding: '0 20px' }}>

                {/* ── Top bar: progress + timer ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {currentQ + 1} of {interviewQs.length}</span>
                        <div style={{ height: 4, width: 200, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${((currentQ + 1) / interviewQs.length) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                    </div>
                    <div className="badge badge-red" style={{ fontSize: 14, fontWeight: 600, padding: '6px 14px' }}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                </div>

                {/* ── Compact camera row (left) + speaking indicator (right) ── */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>

                    {/* Camera feed — browser-native mirror of recording stream */}
                    <div style={{
                        width: 240, minHeight: 185, background: '#0a0a0a', borderRadius: 14, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '2px solid #222', position: 'relative', flexShrink: 0
                    }}>
                        <img
                            ref={videoPreviewRef}
                            src="http://127.0.0.1:5000/video_feed"
                            crossOrigin="anonymous"
                            alt="Proctoring stream"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
                        />
                        {/* Offline fallback shown when stream is not available */}
                        {recordingStatus !== 'recording' && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: '#666', fontSize: 12 }}>
                                <span style={{ fontSize: 28 }}>📷</span>
                                Connecting…
                            </div>
                        )}
                        {/* LIVE badge */}
                        <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.72)', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px #ef4444' }} />LIVE
                        </div>
                        {/* REC badge */}
                        {recordingStatus === 'recording' && (
                            <div style={{ position: 'absolute', bottom: 7, right: 7, background: 'rgba(0,0,0,0.75)', color: '#ef4444', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'recPulse 1.2s ease-in-out infinite' }} />REC
                            </div>
                        )}
                    </div>
                    {/* Warning count shown below camera — not overlapping face */}
                    {proctoringWarnings.length > 0 && (
                        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
                            ⚠️ {proctoringWarnings.length} alert{proctoringWarnings.length !== 1 ? 's' : ''}
                        </div>
                    )}
                    <div style={{ flex: 1, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, border: '1px solid #334155' }}>
                        {/* Mic status pill */}
                        <div>
                            {isListening ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', padding: '6px 14px', borderRadius: 20 }}>
                                    <span style={{ fontSize: 14 }}>🎤</span>
                                    <span style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 600 }}>Listening… speak your answer</span>
                                    <span style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 14 }}>
                                        {[0, 0.1, 0.2, 0.1, 0].map((d, i) => (
                                            <span key={i} style={{ width: 3, height: [6, 10, 14, 10, 6][i], background: '#34d399', borderRadius: 2, animation: `soundBar 0.6s ${d}s ease-in-out infinite alternate` }} />
                                        ))}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.25)', padding: '6px 14px', borderRadius: 20 }}>
                                    <span style={{ fontSize: 13, color: '#9ca3af' }}>⏸ Microphone paused</span>
                                </div>
                            )}
                        </div>

                        {/* Mic warning if unsupported */}
                        {!speechSupported && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#f87171', padding: '8px 0' }}>⚠️ Use Chrome for speech.</span>
                            </div>
                        )}

                        <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Your spoken answer is captured automatically.</p>
                    </div>
                </div>

                {recordingStatus === 'uploading' && (
                    <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>⏳ Saving recording…</div>
                )}

                {/* ── Question + Answer card ── */}
                <div className="card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span className="badge badge-blue">{q?.difficulty}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speak your answer loud and clear.</span>
                    </div>

                    {/* Question text with a distinct AI-question styling */}
                    <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 18 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: '#1e40af', margin: 0 }}>
                            🤖 {q?.question}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                        <button className="btn btn-secondary" disabled={currentQ === 0}
                            onClick={() => { setCurrentQ(c => c - 1); }}>
                            ← Previous
                        </button>
                        {currentQ < interviewQs.length - 1 ? (
                            <button className="btn btn-primary"
                                onClick={() => { setCurrentQ(c => c + 1); }}>
                                Next →
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={submitInterview} disabled={loading}>
                                {loading ? 'Submitting…' : 'Submit Interview ✓'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'disqualified') {
        return (
            <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px' }}>
                <div className="card animate-fade-in" style={{ padding: 36, textAlign: 'center', border: '2px solid var(--danger)' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>Interview Terminated</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
                        You have been <strong style={{ color: 'var(--danger)' }}>disqualified</strong> from this interview due to a <strong>tab switch violation</strong>.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                        This incident has been recorded and will be reviewed by the recruiter.
                    </p>
                    <div style={{ background: 'var(--danger-light)', padding: '10px 16px', borderRadius: 8, marginBottom: 24, fontSize: 13, color: 'var(--danger)' }}>
                        ⚠️ Reason: Tab switch detected during live interview
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/candidate/jobs')} style={{ padding: '12px 32px' }}>
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'interview_result') {
        return (
            <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px' }}>
                <div className="card animate-fade-in" style={{ padding: 36, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Assessment Complete!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        Your responses have been evaluated. The recruiter will review your results.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/candidate/jobs')} style={{ padding: '12px 32px' }}>
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
