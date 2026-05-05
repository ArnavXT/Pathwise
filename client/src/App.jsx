import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import QuizChallenge from './pages/QuizChallenge';
import Analytics from './pages/Analytics';
import Badges from './pages/Badges';
import Settings from './pages/Settings';
import { useAppContext } from './context/AppContext';

export default function App() {
  const { loading } = useAppContext();

  if (loading) {
    return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <Sidebar />
        <main className="main-content">
          <div className="bg-glow"></div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quiz" element={<QuizChallenge />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
