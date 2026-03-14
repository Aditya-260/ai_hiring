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
    const [confirmSubmit, setConfirmSubmit] = useState(null);
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
    const [agreed, setAgreed] = useState(false);


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



    // Anti-cheating: Prevent browser back button
    useEffect(() => {
        if (phase === 'aptitude' || phase === 'interview') {
            window.history.pushState(null, null, window.location.href);
            const handlePopState = (e) => {
                showToast('You cannot go back during an active assessment!', 'error');
                window.history.pushState(null, null, window.location.href);
            };
            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [phase, showToast]);

    // Anti-cheating: disable copy-paste AND right-click context menu
    useEffect(() => {
        const prevent = (e) => {
            if (phase === 'aptitude' || phase === 'interview') {
                e.preventDefault();
                showToast('Copy/paste is disabled during assessment', 'error');
            }
        };
        const preventContext = (e) => {
            if (phase === 'aptitude' || phase === 'interview') {
                e.preventDefault();
            }
        };
        document.addEventListener('copy', prevent);
        document.addEventListener('paste', prevent);
        document.addEventListener('contextmenu', preventContext);
        return () => {
            document.removeEventListener('copy', prevent);
            document.removeEventListener('paste', prevent);
            document.removeEventListener('contextmenu', preventContext);
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
            fetch('http://127.0.0.1:8000/api/proctor/set_active_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: `candidate_${jobId}` })
            }).catch(e => console.error(e));

            // Connect to real-time proctoring stream
            const eventSource = new EventSource('http://127.0.0.1:8000/api/proctor/warnings_feed');
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

    // Stop proctoring camera after interview ends
    const stopProctoring = () => {
        // Clear the img src so camera indicator light turns off in browser
        if (videoPreviewRef.current) videoPreviewRef.current.src = '';
        // Tell FastAPI to stop the camera threads
        fetch('http://127.0.0.1:8000/api/proctor/stop', { method: 'POST' }).catch(() => { });
    };

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
            // Only request AUDIO from browser — OpenCV Python process owns the camera
            // so we cannot use getUserMedia({video}) without blocking it.
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
            });
            recordingChunksRef.current = [];

            // Capture video from the MJPEG <img> element via canvas
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            let drawFrameId;
            const drawFrame = () => {
                if (videoPreviewRef.current && videoPreviewRef.current.complete && videoPreviewRef.current.naturalWidth > 0) {
                    try { ctx.drawImage(videoPreviewRef.current, 0, 0, canvas.width, canvas.height); } catch (e) { }
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

    const submitAllWarningsToBackend = async (disqualified = false, disqualifyReason = '') => {
        try {
            await api.post(`/candidate/assessment/${jobId}/warnings`, {
                warnings: proctoringWarnings,
                cheating_probability: calculateCheatingProbability(proctoringWarnings, tabWarnings),
                disqualified,
                disqualify_reason: disqualifyReason,
                tab_warnings: tabWarnings,
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
            
            // Send warnings collected during aptitude, in case they fail and don't take the interview.
            await submitAllWarningsToBackend();

            setResult(res.data);
            setPhase('aptitude_result');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Submission failed', 'error');
        } finally {
            setLoading(false);
        }
    }, [answers, jobId, showToast, proctoringWarnings, tabWarnings]);

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

            // Stop proctoring camera — interview is over
            stopProctoring();
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

            // Stop proctoring camera
            stopProctoring();

            // Submit whatever answers were given so far
            const formatted = interviewQs.map(q => ({
                question_id: q.question_id,
                question: q.question,
                answer: interviewAnswers[q.question_id] || '',
            }));
            await api.post(`/candidate/interview/${jobId}/submit`, { answers: formatted }).catch(() => { });

            // Save warnings with disqualified flag
            await submitAllWarningsToBackend(true, 'Tab switch detected during live interview');
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
            await submitAllWarningsToBackend(true, 'Exceeded allowed tab switches during Aptitude test');
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
            <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px' }}>
                <div className="card animate-fade-in" style={{ padding: '40px 48px', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 32, textAlign: 'center', color: '#1e293b' }}>Instruction page</h2>

                    <div style={{ color: '#334155', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 20 }}>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8, marginTop: 0 }}>Technical Setup:</h3>
                            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <li>This exam is designed to be taken exclusively on a laptop or Desktop.</li>
                                <li>Ensure your device (Laptop or Desktop) is in good working condition with a reliable internet connection.</li>
                                <li>Confirm that the webcam and microphone are functioning properly for video and audio monitoring during the exam.</li>
                                <li>Use a supported web browser and update it to the latest version to avoid compatibility issues with the online exam platform.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Assessment Structure & Time Management:</h3>
                            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <li><strong>Part 1: Aptitude Test</strong> — 20 MCQ questions (30 min, 40% cutoff).</li>
                                <li><strong>Part 2: Live AI Interview</strong> — 5 role-specific questions (45 min) requiring spoken answers.</li>
                                <li>Plan your time effectively, allocating specific time slots for each section to ensure completion within the designated time.</li>
                                <li>Keep an eye on the clock and pace yourself throughout the exam to avoid rushing through questions or running out of time.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Secure Environment:</h3>
                            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <li>Choose a quiet and well-lit room with minimal distractions to create an exam-friendly environment.</li>
                                <li>Remove any unnecessary items from your desk or surrounding area to minimize the risk of academic misconduct.</li>
                                <li>Inform family members or roommates about the scheduled exam time to avoid interruptions.</li>
                            </ul>
                        </div>

                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', padding: '12px 16px', borderRadius: '4px', color: '#b91c1c', marginTop: 8 }}>
                            <strong>Reminder:</strong> During the assessment if the student found switching the tab, the student will get two warnings and with the third time, the assessment will be closed and the attempt status will be marked as failed. Copy-pasting is also disabled.
                        </div>
                    </div>

                    <div style={{ marginTop: 28, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                            type="checkbox"
                            id="agreeCheckbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
                        />
                        <label htmlFor="agreeCheckbox" style={{ fontSize: 14, fontWeight: 500, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                            Agree *
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/candidate/jobs')}
                            style={{ padding: '10px 28px', background: '#f87171', color: 'white', border: 'none' }}
                        >
                            Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={startAptitude}
                            disabled={!agreed || loading}
                            style={{ padding: '10px 28px', background: '#3B82F6', color: 'white', border: 'none', opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }}
                        >
                            {loading ? 'Processing...' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'aptitude') {
        const q = questions?.[currentQ];
        const totalQ = questions?.length || 0;
        const answeredCount = Object.keys(answers).length;

        return (
            <div
                style={{ width: '100%', maxWidth: 1400, margin: '20px auto', padding: '0 24px', userSelect: 'none', display: 'flex', gap: 32, alignItems: 'flex-start' }}
                onContextMenu={e => e.preventDefault()}
            >
                {/* ── Left: Question Navigation Sidebar ── */}
                <div style={{
                    width: 300, flexShrink: 0, background: 'white', borderRadius: 14,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid var(--border)',
                    padding: '22px 18px', position: 'sticky', top: 20,
                }}>
                    {/* Title + count */}
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 5 }}>Questions</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                        {answeredCount} / {totalQ} Answered
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                        {[
                            { color: '#2563eb', label: 'Current' },
                            { color: '#16a34a', label: 'Answered' },
                            { color: '#d1d5db', label: 'Not Answered' },
                        ].map(({ color, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                <span style={{ width: 14, height: 14, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Question grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {questions.map((ques, idx) => {
                            const isCurrentQ = idx === currentQ;
                            const isAnswered = ques?.id && answers[ques.id] !== undefined;
                            let bg = '#e5e7eb';       // not answered
                            let color = '#374151';
                            if (isCurrentQ) { bg = '#2563eb'; color = 'white'; }
                            else if (isAnswered) { bg = '#16a34a'; color = 'white'; }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQ(idx)}
                                    style={{
                                        width: 44, height: 44, border: 'none', borderRadius: 8,
                                        background: bg, color: color,
                                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                        transition: 'transform 0.1s, box-shadow 0.1s',
                                        boxShadow: isCurrentQ ? '0 0 0 3px rgba(37,99,235,0.3)' : 'none',
                                    }}
                                    onMouseEnter={e => { if (!isCurrentQ) e.currentTarget.style.transform = 'scale(1.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right: Question area ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {currentQ + 1} of {totalQ}</span>
                            <div style={{ height: 4, width: '100%', maxWidth: 260, background: 'var(--bg-secondary)', borderRadius: 2, marginTop: 6 }}>
                                <div style={{ height: '100%', width: `${totalQ ? ((answeredCount) / totalQ) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                                {totalQ ? Math.round((answeredCount / totalQ) * 100) : 0}% Complete
                            </span>
                        </div>
                        <div className="badge badge-red" style={{ fontSize: 14, fontWeight: 600, padding: '6px 14px' }}>
                            ⏱ {formatTime(timeLeft)}
                        </div>
                    </div>

                    {tabWarnings > 0 && (
                        <div style={{ padding: '8px 14px', background: 'var(--danger-light)', borderRadius: 8, marginBottom: 14, fontSize: 13, color: 'var(--danger)' }}>
                            ⚠️ Tab switch warnings: {tabWarnings}/3
                        </div>
                    )}

                    <div className="card" style={{ padding: 28 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
                            Q{currentQ + 1}. {q?.text}
                        </h3>
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
                                <button className="btn btn-success" onClick={() => setConfirmSubmit('aptitude')} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Test'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {confirmSubmit === 'aptitude' && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card animate-fade-in" style={{ padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', background: 'white' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Ready to Submit?</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, whiteSpace: 'normal', lineHeight: 1.5 }}>
                                Are you sure you want to submit your aptitude test? You cannot return to these questions.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button className="btn btn-secondary" onClick={() => setConfirmSubmit(null)} disabled={loading}>
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => {
                                        submitAptitude();
                                        setConfirmSubmit(null);
                                    }} 
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Confirm Submission'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
            <div
                style={{ maxWidth: 740, margin: '30px auto', padding: '0 20px', userSelect: 'none' }}
                onContextMenu={e => e.preventDefault()}
            >

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
                            src="http://127.0.0.1:8000/api/proctor/video_feed"
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
                            <button className="btn btn-success" onClick={() => setConfirmSubmit('interview')} disabled={loading}>
                                {loading ? 'Submitting…' : 'Submit Interview ✓'}
                            </button>
                        )}
                    </div>
                </div>

                {confirmSubmit === 'interview' && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card animate-fade-in" style={{ padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', background: 'white' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Ready to Submit?</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, whiteSpace: 'normal', lineHeight: 1.5 }}>
                                Are you sure you want to submit your interview? This will securely save your recording.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button className="btn btn-secondary" onClick={() => setConfirmSubmit(null)} disabled={loading}>
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => {
                                        submitInterview();
                                        setConfirmSubmit(null);
                                    }} 
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Confirm Submission'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
