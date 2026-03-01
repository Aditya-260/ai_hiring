import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';

import EntryPage from './pages/EntryPage';
import AuthPage from './pages/AuthPage';
import CandidateJobs from './pages/candidate/CandidateJobs';
import AssessmentFlow from './pages/candidate/AssessmentFlow';
import CandidateApplications from './pages/candidate/CandidateApplications';
import CandidateProfile from './pages/candidate/CandidateProfile';
import RecruiterCompany from './pages/recruiter/RecruiterCompany';
import RecruiterJobs from './pages/recruiter/RecruiterJobs';
import CandidateDashboard from './pages/recruiter/CandidateDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
import QuestionBank from './pages/admin/QuestionBank';
import SecurityLogs from './pages/admin/SecurityLogs';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function AdminLayout({ children }) {
  return (
    <>
      <AdminNavbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/entry" replace />} />
            <Route path="/entry" element={<EntryPage />} />

            {/* Auth */}
            <Route path="/candidate/login" element={<AuthPage mode="login" />} />
            <Route path="/candidate/signup" element={<AuthPage mode="signup" />} />
            <Route path="/recruiter/login" element={<AuthPage mode="login" />} />
            <Route path="/recruiter/signup" element={<AuthPage mode="signup" />} />

            {/* Candidate */}
            <Route path="/candidate/jobs" element={<ProtectedRoute roles={['candidate']}><Layout><CandidateJobs /></Layout></ProtectedRoute>} />
            <Route path="/candidate/applications" element={<ProtectedRoute roles={['candidate']}><Layout><CandidateApplications /></Layout></ProtectedRoute>} />
            <Route path="/candidate/profile" element={<ProtectedRoute roles={['candidate']}><Layout><CandidateProfile /></Layout></ProtectedRoute>} />
            <Route path="/candidate/assessment/:jobId" element={<ProtectedRoute roles={['candidate']}><Layout><AssessmentFlow /></Layout></ProtectedRoute>} />

            {/* Recruiter */}
            <Route path="/recruiter/company" element={<ProtectedRoute roles={['recruiter']}><Layout><RecruiterCompany /></Layout></ProtectedRoute>} />
            <Route path="/recruiter/jobs" element={<ProtectedRoute roles={['recruiter']}><Layout><RecruiterJobs /></Layout></ProtectedRoute>} />
            <Route path="/recruiter/job/:jobId/candidates" element={<ProtectedRoute roles={['recruiter']}><Layout><CandidateDashboard /></Layout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
            <Route path="/admin/companies" element={<AdminLayout><CompanyManagement /></AdminLayout>} />
            <Route path="/admin/questions" element={<AdminLayout><QuestionBank /></AdminLayout>} />
            <Route path="/admin/logs" element={<AdminLayout><SecurityLogs /></AdminLayout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/entry" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
