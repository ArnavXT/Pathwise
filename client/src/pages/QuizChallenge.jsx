import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Zap, AlertTriangle, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function QuizChallenge() {
  const { state, apiKey, fetchState } = useAppContext();
  const location = useLocation();
  const [selectedModule, setSelectedModule] = useState(location.state?.module || '');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const generatedModules = state.roadmap.filter(m => state.generated_content[m]);

  const loadQuiz = async () => {
    if (!selectedModule || !apiKey) {
      alert("Please select a module and ensure API Key is set in Settings.");
      return;
    }
    setQuizLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName: selectedModule, apiKey })
      });
      const data = await res.json();
      if (res.ok && data.quiz && data.quiz.questions && data.quiz.questions.length > 0) {
        setQuizData(data.quiz);
        setAnswers({});
        setSubmitted(false);
        setResultData(null);
      } else {
        alert("Failed to load quiz scenario or JSON parsing failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    const questions = quizData.questions;
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName: selectedModule, answers, questions, apiKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setResultData(data.result);
        await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!generatedModules.length) {
    return (
      <div className="p-4" style={{maxWidth:'800px', margin:'100px auto', textAlign:'center'}}>
        <AlertTriangle size={48} color="var(--accent-orange)" style={{marginBottom:16}} />
        <h2 style={{fontSize:'2rem', marginBottom:8}}>No Content Generated</h2>
        <p style={{color:'var(--text-secondary)'}}>You must generate course modules inside the Dashboard before taking a challenge.</p>
        <button className="btn-primary" onClick={() => navigate('/')} style={{marginTop: 24}}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-4" style={{maxWidth: '900px', margin: '0 auto'}}>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
        <h1 className="text-glow-orange" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🧪 Challenge Mode</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Test your knowledge contextually under pressure.</p>
      </div>

      {!quizData && (
        <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            className="input-modern" 
            style={{flex:1, appearance: 'none'}}
            value={selectedModule} 
            onChange={e => setSelectedModule(e.target.value)}
          >
            <option value="" disabled>Select a compiled module...</option>
            {generatedModules.map((m, i) => <option key={i} value={m}>{m}</option>)}
          </select>
          <button className="btn-primary" onClick={loadQuiz} disabled={quizLoading} style={{minWidth:180, display:'flex', gap:8, justifyContent:'center'}}>
            {quizLoading ? <Loader2 className="animate-spin" /> : <><Zap size={18}/> Intitiate</>}
          </button>
        </div>
      )}

      {quizData && !submitted && (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
          {quizData.scenario && (
            <div className="glass-card" style={{borderLeftColor:'var(--accent-blue)', marginBottom: 32}}>
              <h3 style={{color:'var(--accent-blue)', marginBottom: 8}}>🗺️ Mission Briefing</h3>
              <p style={{fontSize:'1.1rem'}}>{quizData.scenario}</p>
            </div>
          )}

          {quizData.questions.map((q, qIndex) => (
            <div key={qIndex} className="glass-card" style={{marginBottom: 24}}>
              <div style={{color:'var(--accent-orange)', fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.1em', marginBottom:12}}>CHALLENGE {qIndex + 1} OF {quizData.questions.length}</div>
              <p style={{fontSize:'1.2rem', fontWeight:500, marginBottom: 20}}>{q.question}</p>
              
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {q.options.map((opt, oIndex) => {
                  const letter = opt[0];
                  const isSelected = answers[qIndex] === letter;
                  return (
                    <div 
                      key={oIndex} 
                      onClick={() => setAnswers(prev => ({...prev, [qIndex]: letter}))}
                      style={{
                        padding: '16px', 
                        borderRadius: 'var(--border-radius-md)',
                        background: isSelected ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <span style={{fontWeight:600, color: isSelected ? 'var(--accent-orange)' : 'var(--text-secondary)', marginRight:12}}>{letter}.</span>
                      {opt.substring(2).trim()}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="btn-primary" style={{width:'100%', padding:'16px', fontSize:'1.2rem', marginTop: 16}} onClick={submitQuiz} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" style={{margin:'0 auto'}}/> : "🚀 Submit Answers"}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {submitted && resultData && (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="glass-card" style={{textAlign:'center', padding:'40px', marginTop: 32}}>
            {resultData.score >= 80 ? (
              <ShieldCheck size={64} color="var(--accent-green)" style={{margin:'0 auto 24px'}} />
            ) : (
              <AlertTriangle size={64} color="var(--accent-red)" style={{margin:'0 auto 24px'}} />
            )}
            <h2 style={{fontSize:'3rem', marginBottom: 8, color: resultData.score >= 80 ? 'var(--accent-green)' : 'var(--accent-red)'}}>{resultData.score}%</h2>
            <p style={{fontSize:'1.2rem', color:'var(--text-secondary)', marginBottom: 24}}>
              {resultData.correct} / {resultData.total} correct
            </p>
            <div className="tag tag-orange" style={{fontSize:'1rem', padding:'8px 16px', marginBottom: 32}}>+{resultData.xp_earned} XP ⚡</div>
            
            <div style={{display:'flex', justifyContent:'center', gap:16}}>
              <button className="btn-secondary" onClick={() => {setQuizData(null); setSubmitted(false);}}>Start New Mission <ArrowRight size={16} style={{display:'inline', marginLeft:4}}/></button>
              <button className="btn-primary" onClick={() => navigate('/analytics')}>View Analytics</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
