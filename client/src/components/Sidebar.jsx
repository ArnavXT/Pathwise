import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Zap, BarChart2, Award, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { state } = useAppContext();

  // Simple level calc
  const level = Math.floor(state.xp / 1000) + 1;
  const levelNames = ["Novice", "Apprentice", "Adept", "Scholar", "Master"];
  const levelStr = levelNames[Math.min(level - 1, 4)];
  const xpStr = state.xp;

  return (
    <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--accent-orange)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={24} color="white" />
        </div>
        <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>Pathwise</h2>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Your Profile</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem' }}>🎓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{xpStr} XP</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-orange)' }}>{levelStr}</div>
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <NavItem to="/" icon={<Home size={20} />} label="Dashboard" />
        <NavItem to="/quiz" icon={<Zap size={20} />} label="Challenge Mode" />
        <NavItem to="/analytics" icon={<BarChart2 size={20} />} label="Analytics" />
        <NavItem to="/badges" icon={<Award size={20} />} label="Badges" />
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <NavItem to="/settings" icon={<Settings size={20} />} label="Developer Settings" />
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive ? 'var(--accent-orange)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-orange-dim)' : 'transparent',
        transition: 'var(--transition-fast)',
        fontWeight: 500
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}
