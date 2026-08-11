import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Downloader } from './pages/Downloader';
import { Terminal } from './pages/Terminal';
import { AdultArea } from './pages/AdultArea';
import { Admin } from './pages/Admin';
import { useAuthStore } from './store/authStore';




import { Home, DownloadCloud, Terminal as TerminalIcon, User, Flame } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const MobileHeader = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-center z-50 sm:hidden">
      <div className="font-bold text-xl tracking-wider text-[var(--color-primary)]">NEXUS</div>
    </header>
  );
};

const MobileNav = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  if (!user) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/downloader', icon: DownloadCloud, label: 'Download' },
    { path: '/terminal', icon: TerminalIcon, label: 'Terminal' },
    { path: '/adult', icon: Flame, label: '18+' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--border)] flex justify-around items-center z-50 sm:hidden pb-safe">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <Link key={path} to={path} className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-300'}`}>
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const DesktopSidebar = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <aside className="hidden sm:flex flex-col w-64 border-r border-[var(--border)] p-4 h-screen sticky top-0">
      <div className="text-2xl font-bold text-[var(--color-primary)] mb-8">NEXUS</div>
      <nav className="flex flex-col gap-4">
        <Link to="/" className="text-xl font-medium hover:text-[var(--color-primary)] transition-colors">Home</Link>
        <Link to="/downloader" className="text-xl font-medium hover:text-[var(--color-primary)] transition-colors">Downloader</Link>
        <Link to="/terminal" className="text-xl font-medium hover:text-[var(--color-primary)] transition-colors">Terminal</Link>
        <Link to="/profile" className="text-xl font-medium hover:text-[var(--color-primary)] transition-colors">Profile</Link>
        <Link to="/adult" className="text-xl font-medium text-red-500 hover:text-red-400 transition-colors">18+ Area</Link>
      </nav>
    </aside>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <div className="flex min-h-screen max-w-7xl mx-auto w-full">
        <DesktopSidebar />
        
        <main className="flex-1 flex flex-col min-h-screen pb-16 sm:pb-0">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/downloader" element={<ProtectedRoute><Downloader /></ProtectedRoute>} />
            <Route path="/terminal" element={<ProtectedRoute><Terminal /></ProtectedRoute>} />
            <Route path="/adult" element={<ProtectedRoute><AdultArea /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          </Routes>
        </main>
        
        <MobileNav />
      </div>
    </Router>
  );
}

export default App;
