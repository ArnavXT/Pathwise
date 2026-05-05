import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Award, Zap, Star, Target, CheckCircle } from 'lucide-react';

const ALL_BADGES = [
    { id: "first_module", name: "Initiate", desc: "Generate your first module.", icon: "🌱" },
    { id: "first_quiz", name: "Challenger", desc: "Take your first quiz.", icon: "⚔️" },
    { id: "perfect_score", name: "Flawless", desc: "Get a 100% on a quiz.", icon: "🌟" },
    { id: "five_quizzes", name: "Consistent", desc: "Complete 5 quizzes.", icon: "🔥" },
    { id: "level_5", name: "Adept Learner", desc: "Reach 5000 XP.", icon: "🧙" }
];

export default function Badges() {
  const { state } = useAppContext();
  
  const earned = new Set(state.earned_badges || []);
  const level = Math.floor(state.xp / 1000) + 1;
  const xpStr = state.xp;
  const xp_remaining = 1000 - (state.xp % 1000);
  const xp_progress = (state.xp % 1000) / 1000;

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-4" style={{maxWidth: '1000px', margin: '0 auto'}}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-glow-orange" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏅 Achievements</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Track your gamified learning progress.</p>
      </div>

      <div className="glass-card" style={{display:'flex', alignItems:'center', gap:32, flexWrap:'wrap', padding:'32px', marginBottom:40}}>
        <div style={{fontSize:'4rem'}}>🎓</div>
        <div style={{flex:1}}>
          <h2 style={{fontSize:'1.8rem'}}>Level {level}</h2>
          <div style={{color:'var(--text-secondary)', marginBottom: 16}}>{xpStr} XP Total · {xp_remaining} XP to next level</div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-orange), var(--accent-blue))' }}
              initial={{ width: 0 }}
              animate={{ width: `${xp_progress * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut'}}
            />
          </div>
        </div>
        <div style={{textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:32}}>
          <div style={{fontSize:'3rem', color:'var(--accent-orange)', fontWeight:800, lineHeight:1}}>{earned.size}</div>
          <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', letterSpacing:'0.1em'}}>BADGES</div>
        </div>
      </div>

      <h3 style={{fontSize:'1.5rem', marginBottom: 24}}>All Badges</h3>
      <div className="grid-cards">
        {ALL_BADGES.map((badge, i) => {
          const isEarned = earned.has(badge.id);
          return (
            <motion.div 
              key={badge.id} 
              className="glass-card" 
              style={{
                opacity: isEarned ? 1 : 0.5,
                borderColor: isEarned ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.08)'
              }}
              whileHover={{scale: 1.02}}
            >
              <div style={{fontSize:'2.5rem', marginBottom: 16}}>{isEarned ? badge.icon : '🔒'}</div>
              <h4 style={{color: isEarned ? 'var(--accent-orange)' : 'var(--text-secondary)', fontSize:'1.2rem', marginBottom: 8}}>{badge.name}</h4>
              <p style={{fontSize:'0.9rem', color:'var(--text-secondary)', marginBottom: 16}}>{badge.desc}</p>
              
              <div style={{fontSize:'0.8rem', fontWeight: 600, color: isEarned ? 'var(--accent-green)' : '#555'}}>
                {isEarned ? <><CheckCircle size={14} style={{display:'inline', marginRight:4}}/> Earned</> : "Locked"}
              </div>
            </motion.div>
          );
        })}
      </div>

      <h3 style={{fontSize:'1.5rem', marginTop: 40, marginBottom: 24}}>⚡ How to Earn XP</h3>
      <div className="grid-cards" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
        <div className="glass-card flex-col" style={{alignItems:'center', textAlign:'center', justifyItems:'center', padding:24}}>
          <BookOpen color="var(--accent-blue)" style={{marginBottom:16}} />
          <p style={{color:'var(--text-secondary)', marginBottom:8, fontSize:'0.9rem'}}>Generate Module</p>
          <div style={{color:'var(--accent-orange)', fontWeight:700, fontSize:'1.2rem'}}>+100 XP</div>
        </div>
        <div className="glass-card flex-col" style={{alignItems:'center', textAlign:'center', justifyItems:'center', padding:24}}>
          <Zap color="var(--accent-orange)" style={{marginBottom:16}} />
          <p style={{color:'var(--text-secondary)', marginBottom:8, fontSize:'0.9rem'}}>Complete Quiz</p>
          <div style={{color:'var(--accent-orange)', fontWeight:700, fontSize:'1.2rem'}}>+50 XP</div>
        </div>
        <div className="glass-card flex-col" style={{alignItems:'center', textAlign:'center', justifyItems:'center', padding:24}}>
          <Target color="var(--accent-green)" style={{marginBottom:16}} />
          <p style={{color:'var(--text-secondary)', marginBottom:8, fontSize:'0.9rem'}}>Score ≥ 80%</p>
          <div style={{color:'var(--accent-green)', fontWeight:700, fontSize:'1.2rem'}}>+20 Bonus</div>
        </div>
        <div className="glass-card flex-col" style={{alignItems:'center', textAlign:'center', justifyItems:'center', padding:24}}>
          <Star color="var(--accent-orange)" style={{marginBottom:16}} />
          <p style={{color:'var(--text-secondary)', marginBottom:8, fontSize:'0.9rem'}}>Score 100%</p>
          <div style={{color:'var(--accent-orange)', fontWeight:700, fontSize:'1.2rem'}}>+50 Bonus</div>
        </div>
      </div>
    </motion.div>
  );
}

// Minimal inline icon dependency fallback
const BookOpen = ({color, style}) => <div style={{background:'rgba(59,130,246,0.1)', padding:'12px', borderRadius:'12px', ...style}}><Award color={color} /></div>;
