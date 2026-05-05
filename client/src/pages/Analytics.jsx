import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, AlertCircle, Award } from 'lucide-react';

export default function Analytics() {
  const { state } = useAppContext();
  const results = state.quizzes_taken || [];

  if (results.length === 0) {
    return (
      <div className="p-4" style={{maxWidth:'800px', margin:'100px auto', textAlign:'center'}}>
        <Target size={48} color="var(--accent-blue)" style={{marginBottom:16}} />
        <h2 style={{fontSize:'2rem', marginBottom:8}}>No Data Yet</h2>
        <p style={{color:'var(--text-secondary)'}}>Complete some quizzes in Challenge Mode to unlock your analytics dashboard!</p>
      </div>
    );
  }

  const total = results.length;
  const avg = total > 0 ? (results.reduce((a, b) => a + b.score, 0) / total).toFixed(0) : 0;
  const best = Math.max(...results.map(r => r.score));
  const worst = Math.min(...results.map(r => r.score));

  const passCount = results.filter(r => r.score >= 60).length;
  const pieData = [
    { name: 'Pass (≥60%)', value: passCount },
    { name: 'Fail (<60%)', value: total - passCount }
  ];
  const COLORS = ['#22c55e', '#ef4444'];
  
  const historyData = results.map((r, i) => ({
    name: `Q${i+1}`,
    score: r.score,
    topic: r.subtopic.slice(0,10)
  }));

  const topicMap = {};
  results.forEach(r => {
    if(!topicMap[r.subtopic]) topicMap[r.subtopic] = {sum:0, count:0};
    topicMap[r.subtopic].sum += r.score;
    topicMap[r.subtopic].count += 1;
  });
  const barData = Object.keys(topicMap).map(k => ({
    topic: k.slice(0,15),
    avg: Math.round(topicMap[k].sum / topicMap[k].count)
  }));

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-4" style={{maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-glow-orange" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📊 Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Deep dive into your learning performance.</p>
      </div>

      <div className="grid-cards" style={{ marginBottom: '40px' }}>
        <div className="glass-card flex-col" style={{textAlign:'center'}}>
          <div className="metric-value">{total}</div>
          <div className="metric-label">Quizzes</div>
        </div>
        <div className="glass-card flex-col" style={{textAlign:'center'}}>
          <div className="metric-value">{avg}%</div>
          <div className="metric-label">Average</div>
        </div>
        <div className="glass-card flex-col" style={{textAlign:'center'}}>
          <div className="metric-value" style={{color:'var(--accent-green)'}}>{best}%</div>
          <div className="metric-label">Best</div>
        </div>
        <div className="glass-card flex-col" style={{textAlign:'center'}}>
          <div className="metric-value" style={{color:'var(--accent-red)'}}>{worst}%</div>
          <div className="metric-label">Lowest</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'40px'}}>
        <div className="glass-card">
          <h3 style={{marginBottom: 24, display:'flex', alignItems:'center', gap:8}}><TrendingUp size={20} color="var(--accent-blue)"/> Score Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" domain={[0,100]} />
              <Tooltip contentStyle={{backgroundColor:'#111', border:'1px solid #333', borderRadius:'8px'}} />
              <Line type="monotone" dataKey="score" stroke="var(--accent-blue)" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 style={{marginBottom: 24, display:'flex', alignItems:'center', gap:8}}><Award size={20} color="var(--accent-orange)"/> Avg Score per Module</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="topic" stroke="#666" fontSize={11}/>
              <YAxis stroke="#666" domain={[0,100]} />
              <Tooltip contentStyle={{backgroundColor:'#111', border:'1px solid #333', borderRadius:'8px', color:'#fff'}} cursor={{fill:'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="avg" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'24px'}}>
        <div className="glass-card" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <h3 style={{marginBottom: 16, alignSelf:'flex-start'}}>Pass vs Fail</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{backgroundColor:'#111', border:'none', borderRadius:'8px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 style={{marginBottom: 24, display:'flex', alignItems:'center', gap:8, color:'var(--accent-orange)'}}><AlertCircle size={20} color="var(--accent-orange)"/> Knowledge Gaps & Analysis</h3>
          {state.knowledge_gaps && state.knowledge_gaps.length > 0 ? (
            <div style={{marginBottom: 16}}>
              <strong style={{display:'block', marginBottom:8, color:'var(--text-secondary)'}}>Identified Weaknesses:</strong>
              {state.knowledge_gaps.map((g,i) => <span key={i} className="tag tag-red" style={{margin:'0 8px 8px 0', background:'rgba(239,68,68,0.15)', color:'var(--accent-red)', border:'1px solid rgba(239,68,68,0.3)'}}>⚠ {g}</span>)}
            </div>
          ) : <p style={{color:'var(--accent-green)', marginBottom:16}}>No major gaps detected!</p>}

          {state.gap_recommendation && (
            <div style={{background:'rgba(59,130,246,0.1)', borderLeft:'4px solid var(--accent-blue)', padding:'16px', borderRadius:'0 8px 8px 0'}}>
              <strong style={{color:'var(--accent-blue)', display:'block', marginBottom:4}}>🤖 AI Study Recommendation</strong>
              <p style={{fontSize:'0.95rem'}}>{state.gap_recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
