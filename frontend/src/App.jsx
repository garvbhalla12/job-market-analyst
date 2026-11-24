import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SkillsAnalytics from './pages/SkillsAnalytics';
import SalaryAnalytics from './pages/SalaryAnalytics';
import LocationAnalytics from './pages/LocationAnalytics';
import CompanyAnalytics from './pages/CompanyAnalytics';
import FresherJobs from './pages/FresherJobs';
import JobExplorer from './pages/JobExplorer';
import Profile from './pages/Profile';
import AIAssistant from './pages/AIAssistant';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills" element={<SkillsAnalytics />} />
          <Route path="/salary" element={<SalaryAnalytics />} />
          <Route path="/locations" element={<LocationAnalytics />} />
          <Route path="/companies" element={<CompanyAnalytics />} />
          <Route path="/fresher" element={<FresherJobs />} />
          <Route path="/jobs" element={<JobExplorer />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/assistant/:conversationId" element={<AIAssistant />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
