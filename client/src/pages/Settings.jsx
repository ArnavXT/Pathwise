import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Key, Lock, Unlock, RefreshCw } from 'lucide-react';

export default function Settings() {
  const { apiKey, setApiKey, devAuth, setDevAuth, fetchState } = useAppContext();
  const [password, setPassword] = useState('');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setDevAuth(true);
        setError('');
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const saveApiKey = () => {
    setApiKey(tempApiKey);
    alert('API Key Saved successfully!');
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all progress?")) return;
    try {
      const res = await fetch('http://localhost:5000/api/state/reset', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        alert('Progress reset complete.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!devAuth) {
    return (
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="p-4" style={{maxWidth: '500px', margin: '100px auto', textAlign:'center'}}>
        <div className="glass-card flex-col" style={{alignItems:'center'}}>
          <Lock size={48} color="var(--accent-orange)" style={{marginBottom: 16}} />
          <h2 style={{marginBottom:8, fontSize:'1.8rem'}}>Restricted Area</h2>
          <p style={{color:'var(--text-secondary)', marginBottom:24}}>Enter the developer password to access API configuration.</p>
          <form onSubmit={handleAuth} style={{width:'100%', display:'flex', flexDirection:'column', gap:'16px'}}>
            <input 
              type="password" 
              className="input-modern" 
              placeholder="Developer Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <div style={{color:'var(--accent-red)', fontSize:'0.9rem'}}>{error}</div>}
            <button type="submit" className="btn-primary">Authenticate</button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-4" style={{maxWidth: '800px', margin: '0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40}}>
        <div>
          <h1 className="text-glow-orange" style={{ fontSize: '2.5rem' }}>⚙️ Developer Settings</h1>
          <div className="tag tag-orange" style={{marginTop:8}}><Unlock size={12} style={{display:'inline', marginRight:4}}/> DEV SESSION ACTIVE</div>
        </div>
        <button className="btn-secondary" onClick={() => setDevAuth(false)}>Lock Session</button>
      </div>

      <div className="glass-card" style={{marginBottom: 32}}>
        <h3 style={{display:'flex', alignItems:'center', gap:8, marginBottom: 16}}><Key size={20} color="var(--accent-blue)"/> OpenRouter API Configuration</h3>
        <p style={{color:'var(--text-secondary)', marginBottom: 24}}>This key is required to generate curriculums and quiz content. It is stored in your local browser storage.</p>
        <div style={{display:'flex', gap:16}}>
          <input 
            type="password" 
            className="input-modern"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
          <button className="btn-primary" onClick={saveApiKey} style={{minWidth:140}}>Save Key</button>
        </div>
      </div>

      <div className="glass-card" style={{borderColor:'var(--accent-red-dim)'}}>
        <h3 style={{display:'flex', alignItems:'center', gap:8, marginBottom: 16, color:'var(--accent-red)'}}>
          <RefreshCw size={20} /> Data Management
        </h3>
        <p style={{color:'var(--text-secondary)', marginBottom: 24}}>Resetting student progress will erase all courses, quizzes, and XP from the local database.</p>
        <button className="btn-secondary" onClick={handleReset} style={{color:'var(--accent-red)', borderColor:'rgba(239,68,68,0.3)'}}>
          Reset All Progress
        </button>
      </div>
    </motion.div>
  );
}
