
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import StartPage from './pages/Dashboard/Start';
import ExplorePage from './pages/Dashboard/Explore';
import EditorPage from './pages/Editor/EditorPage';
import PresentationPage from './pages/Presentation/PresentationPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SpaceDetail from './pages/Space/SpaceDetail';
import SpaceSettings from './pages/Space/SpaceSettings';
import AuthModal from './components/Auth/AuthModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for "JWT" simulation
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else if (location.pathname === '/dashboard') {
      navigate('/dashboard/explore');
    }
  }, [navigate, location.pathname]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    navigate('/dashboard/start');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/dashboard/explore');
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout onLogout={handleLogout} onAuthClick={() => setShowAuthModal(true)} />}>
          <Route index element={<Navigate to={isAuthenticated ? "start" : "explore"} replace />} />
          <Route path="start" element={isAuthenticated ? <StartPage /> : <Navigate to="/dashboard/explore" replace />} />
          <Route path="explore" element={<ExplorePage />} />
        </Route>

        {/* Space and Editor Routes */}
        <Route path="/slide/:slideSpaceId" element={<SpaceDetail />} />
        <Route path="/slide/:slideSpaceId/settings/*" element={<SpaceSettings />} />
        <Route path="/slide/:slideSpaceId/:slideId" element={<EditorPage />} />
        
        {/* Presentation */}
        <Route path="/slide/presentation/:slideId" element={<PresentationPage />} />

        {/* User Settings */}
        <Route path="/settings/*" element={<SettingsPage />} />
      </Routes>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
