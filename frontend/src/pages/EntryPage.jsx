import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const companies = [
  { name: 'Darwinbox', abbr: 'Db', color: '#3D5AFE' },
  { name: 'Leadsquared', abbr: 'Ls', color: '#F4811F' },
  { name: 'Hasura', abbr: 'Ha', color: '#1EB4D4' },
  { name: 'Postman', abbr: 'Pm', color: '#FF6C37' },
  { name: 'Slice', abbr: 'Sl', color: '#FF5733' },
  { name: 'Groww', abbr: 'Gr', color: '#00B386' },
  { name: 'Smallcase', abbr: 'Sc', color: '#2F7C57' },
  { name: 'Setu', abbr: 'Se', color: '#6C47FF' },
  { name: 'Signzy', abbr: 'Sg', color: '#1A6EFF' },
  { name: 'Recko', abbr: 'Re', color: '#E84393' },
  { name: 'Clevertap', abbr: 'Ct', color: '#FF5A00' },
  { name: 'Helpshift', abbr: 'Hs', color: '#00C2A8' },
  { name: 'Exotel', abbr: 'Ex', color: '#3B3DB5' },
  { name: 'Springworks', abbr: 'Sp', color: '#F59E0B' },
  { name: 'Keka', abbr: 'Ke', color: '#FF3B3B' },
  { name: 'Zoho Recruit', abbr: 'Zr', color: '#E42527' },
];

const steps = [
  {
    number: '01',
    icon: '📋',
    title: 'Post a Job',
    desc: 'Recruiters create job listings with detailed requirements. AI automatically crafts assessment criteria.',
    color: '#3B82F6',
  },
  {
    number: '02',
    icon: '🤖',
    title: 'AI Screening',
    desc: 'Candidates take intelligent assessments — aptitude tests, coding challenges, and video interviews.',
    color: '#8B5CF6',
  },
  {
    number: '03',
    icon: '📊',
    title: 'Smart Analytics',
    desc: 'Get AI-generated insights, candidate scores, proctoring reports, and performance breakdowns.',
    color: '#10B981',
  },
  {
    number: '04',
    icon: '🎯',
    title: 'Hire the Best',
    desc: 'Make confident decisions with data-driven shortlisting and one-click candidate management.',
    color: '#F59E0B',
  },
];

const features = [
  { icon: '🛡️', title: 'Smart Proctoring', desc: 'Real-time monitoring with face detection, tab-switch alerts, and session recordings to ensure assessment integrity.' },
  { icon: '🧠', title: 'AI Assessments', desc: 'Adaptive aptitude tests, coding challenges, and behavioural questions curated by AI for every job role.' },
  { icon: '📈', title: 'Recruiter Dashboard', desc: 'Visual analytics, candidate pipelines, and shortlisting tools that save hours of manual screening.' },
  { icon: '⚡', title: 'Instant Results', desc: 'Automated scoring and AI-powered reports delivered immediately after each assessment completion.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'Enterprise-grade security with role-based access control and encrypted candidate data.' },
  { icon: '🌐', title: 'Multi-role Platform', desc: 'Seamless experience for both candidates and recruiters with dedicated dashboards for each.' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'HR Lead, TechCorp',
    avatar: 'PS',
    avatarColor: '#3B82F6',
    text: 'Beyond-Hiring cut our screening time by 70%. The AI proctoring and instant reports are a game changer. We hired top engineers in half the time.',
    stars: 5,
  },
  {
    name: 'Rahul Mehta',
    role: 'Software Engineer',
    avatar: 'RM',
    avatarColor: '#10B981',
    text: 'The assessment flow is incredibly smooth. I got instant feedback which helped me understand where I stand. Loved the transparent process.',
    stars: 5,
  },
  {
    name: 'Anita Verma',
    role: 'Talent Acquisition, StartupX',
    avatar: 'AV',
    avatarColor: '#8B5CF6',
    text: 'The recruiter dashboard is brilliant. I can see candidate scores, tab-switch logs, and video recordings all in one place. Highly recommend!',
    stars: 5,
  },
];

const stats = [
  { value: '10x', label: 'Faster Hiring' },
  { value: '70%', label: 'Less Screening Time' },
  { value: '98%', label: 'Assessment Accuracy' },
  { value: '50+', label: 'Companies Trust Us' },
];

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (user) {
      const routes = { candidate: '/candidate/jobs', recruiter: '/recruiter/company' };
      navigate(routes[user.role] || '/entry');
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: #CBD5E1 !important; background: white !important; }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .hero-text-glow { background: linear-gradient(270deg, #3B82F6, #8B5CF6, #10B981, #3B82F6); background-size: 300% 300%; animation: gradientMove 8s ease infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-link { color: #64748B; font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; cursor: pointer; padding: 8px 12px; }
        .nav-link:hover { color: #0F172A; }
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{ position: 'sticky', top: 20, zIndex: 100, padding: '0 24px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <nav style={{
          pointerEvents: 'auto',
          background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: 100,
          padding: '8px 8px 8px 20px', 
          display: 'flex', alignItems: 'center', gap: 40,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
          width: '100%', maxWidth: 1000, justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            <span style={{ fontWeight: 800, fontSize: 26, color: '#0F172A', letterSpacing: '-0.5px' }}>Beyond-Hiring</span>
          </div>
          
          <div className="desktop-nav" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="nav-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})}>How it Works</span>
            <span className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})}>Features</span>
            <span className="nav-link" onClick={() => document.getElementById('testimonials')?.scrollIntoView({behavior: 'smooth'})}>Testimonials</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={{ 
              fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 100, 
              background: 'transparent', color: '#475569', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            onClick={() => navigate('/candidate/login')}>Candidate</button>
            <button style={{ 
              fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 100, 
              background: '#0F172A', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15,23,42,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.2)'; }}
            onClick={() => navigate('/recruiter/login')}>Recruiter</button>
          </div>
        </nav>
      </div>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '92vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 80px',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F5F3FF 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated glowing orbs */}
        <div style={{
          position: 'absolute', width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)',
          top: -300, left: -200, pointerEvents: 'none', animation: 'pulseGlow 10s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)',
          bottom: -250, right: -200, pointerEvents: 'none', animation: 'pulseGlow 12s ease-in-out infinite alternate'
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%)',
          top: '20%', right: '5%', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite'
        }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: 840 }}>
          <span style={{
            display: 'inline-block', marginBottom: 24,
            background: 'linear-gradient(135deg, white, #F1F5F9)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 30, padding: '8px 24px',
            fontSize: 14, fontWeight: 700, color: '#2563EB',
            boxShadow: '0 4px 12px rgba(59,130,246,0.1)',
            textTransform: 'uppercase', letterSpacing: 1
          }}>🚀 AI-Powered Recruitment Platform</span>

          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 76px)', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 28,
            color: '#0F172A',
          }}>
            Hire Smarter with<br />
            <span className="hero-text-glow">Artificial Intelligence</span>
          </h1>

          <p style={{
            fontSize: 20, color: '#475569', lineHeight: 1.6,
            maxWidth: 640, margin: '0 auto 48px', fontWeight: 400
          }}>
            Beyond-Hiring automates screening, runs AI assessments, monitors integrity with smart proctoring, and delivers instant insights.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <button
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 12, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
              onClick={() => navigate('/candidate/signup')}
            >
              I'm a Candidate →
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 12 }}
              onClick={() => navigate('/recruiter/signup')}
            >
              I'm a Recruiter
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap',
            background: 'white', borderRadius: 16, border: '1px solid #E7E5E4',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden',
            maxWidth: 620, margin: '0 auto',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                flex: '1 1 120px', padding: '20px 16px', textAlign: 'center',
                borderRight: i < stats.length - 1 ? '1px solid #E7E5E4' : 'none',
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#3B82F6', letterSpacing: '-1px' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#57534E', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section style={{ padding: '56px 0', background: 'white', borderTop: '1px solid #E7E5E4', borderBottom: '1px solid #E7E5E4', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#A8A29E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 28 }}>
          Trusted by teams at world-class companies
        </p>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 30s linear infinite' }}>
          {[...companies, ...companies].map((c, i) => (
            <div key={`${c.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', opacity: 0.65, transition: 'opacity 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.65'}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 12,
              }}>{c.abbr}</div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#1C1917' }}>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '112px 24px', background: '#FAFAF9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1.5, background: '#EFF6FF', padding: '6px 16px', borderRadius: 20 }}>How It Works</span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', marginTop: 20, color: '#0F172A' }}>
              From posting to hiring<br />in 4 simple steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                className="step-card"
                style={{
                  padding: 32, cursor: 'pointer', borderRadius: 24,
                  background: 'white', border: '1px solid #E2E8F0',
                  transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                  transform: activeStep === i ? 'translateY(-8px)' : 'none',
                  boxShadow: activeStep === i ? `0 20px 40px ${step.color}25` : '0 4px 12px rgba(0,0,0,0.02)',
                  borderColor: activeStep === i ? step.color + '66' : '#E2E8F0',
                }}
              >
                {/* Background glow for active step */}
                {activeStep === i && (
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 120, height: 120, background: step.color, opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' }} />
                )}
                
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: activeStep === i ? step.color : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 20, color: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: activeStep === i ? `0 8px 16px ${step.color}40` : 'none'
                }}>{step.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: step.color, letterSpacing: 1.5, marginBottom: 8 }}>STEP {step.number}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#0F172A', letterSpacing: '-0.5px' }}>{step.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: '#475569', margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '112px 24px', background: 'linear-gradient(180deg, white 0%, #FAFAF9 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 1.5, background: '#F3E8FF', padding: '6px 16px', borderRadius: 20 }}>Platform Features</span>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', marginTop: 20, color: '#0F172A' }}>
              Everything you need to hire right
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} className="card feature-card" style={{ 
                padding: '32px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start',
                transition: 'all 0.3s ease', border: '1px solid #E2E8F0', borderRadius: 24, background: '#FAFAF9'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'white',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <h4 style={{ fontSize: 19, fontWeight: 800, marginBottom: 12, color: '#0F172A', letterSpacing: '-0.5px' }}>{f.title}</h4>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: '#475569', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1 }}>Testimonials</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginTop: 10, color: '#1C1917' }}>
              Loved by recruiters &amp; candidates
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} style={{ color: '#F59E0B', fontSize: 16 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#57534E', marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: t.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 13,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1917' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#A8A29E' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GET STARTED ── */}
      <section style={{
        padding: '96px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #1E3A5F 50%, #064E3B 100%)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', marginBottom: 20 }}>
            Ready to transform your hiring?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
            Join hundreds of companies using Beyond-Hiring to find the best talent faster, fairer, and smarter.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 560, margin: '0 auto' }}>
            {[
              { key: 'candidate', label: 'Find Jobs', sub: 'Apply & showcase your skills', icon: '👤', grad: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', loginPath: '/candidate/login', signupPath: '/candidate/signup' },
              { key: 'recruiter', label: 'Post Jobs', sub: 'Hire smarter with AI insights', icon: '🏢', grad: 'linear-gradient(135deg, #10B981, #059669)', loginPath: '/recruiter/login', signupPath: '/recruiter/signup' },
            ].map((role) => (
              <div key={role.key} style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.12)', padding: 24,
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: role.grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 14,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}>{role.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>{role.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>{role.sub}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: 12, padding: '8px 10px', borderRadius: 8 }}
                    onClick={() => navigate(role.loginPath)}
                  >Login</button>
                  <button
                    style={{
                      flex: 1, fontSize: 12, padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.15)', color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onClick={() => navigate(role.signupPath)}
                  >Sign Up</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '28px 40px', background: '#0F0F0F',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Beyond-Hiring Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '8px' }} />
          <span style={{ fontWeight: 700, color: 'white', fontSize: 18 }}>Beyond-Hiring</span>
        </div>
        <span style={{ fontSize: 13, color: '#57534E' }}>© 2026 Beyond-Hiring. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: '#57534E', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = '#57534E'}
            >{l}</span>
          ))}
        </div>
      </footer>

    </div>
  );
}
