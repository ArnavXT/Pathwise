import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Sparkles, BookOpen, Clock, Loader2, CheckCircle, ChevronDown, ChevronUp, Download, FileText, FileArchive } from 'lucide-react';
import { BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import JSZip from 'jszip';

export default function Dashboard() {
  const { state, apiKey, fetchState } = useAppContext();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModuleLoading, setActiveModuleLoading] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  
  const navigate = useNavigate();

  const totalQuizzes = state.quizzes_taken?.length || 0;
  const avgScore = totalQuizzes > 0 
    ? Math.round(state.quizzes_taken.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes)
    : 0;

  const handleGenerateCourse = async (e) => {
    e.preventDefault();
    if (!topic || !apiKey) {
      alert("Please ensure you have entered a topic and have an API key configured.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/course/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, apiKey })
      });
      if (res.ok) await fetchState();
      else alert("Generation failed. Check API key validity.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (moduleName) => {
    if (!apiKey) return;
    setActiveModuleLoading(moduleName);
    try {
      const res = await fetch('http://localhost:5000/api/course/module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName, apiKey })
      });
      if(res.ok) {
        await fetchState();
        setExpandedModule(moduleName);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setActiveModuleLoading(null);
    }
  };

  const cleanFilename = (str) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const stripMarkdown = (md) => {
    return md.replace(/[*#_~`]/g, '');
  };

  // Single module downloads
  const downloadModuleMD = (moduleName) => {
    const text = state.generated_content[moduleName];
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanFilename(moduleName)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildPDFHtml = (modName, mdText) => {
    let htmlContent = marked.parse(mdText)
      .replace(/<h2/g, '<h2 style="color: #ea580c; margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 5px;"')
      .replace(/<h3/g, '<h3 style="color: #ea580c; margin-top: 1.2em; margin-bottom: 0.5em; font-size: 1.25em;"')
      .replace(/<p>/g, '<p style="margin-bottom: 1em; line-height: 1.6;">')
      .replace(/<ul>/g, '<ul style="margin-left: 24px; margin-bottom: 1em; line-height: 1.6;">')
      .replace(/<ol>/g, '<ol style="margin-left: 24px; margin-bottom: 1em; line-height: 1.6;">')
      .replace(/<li>/g, '<li style="margin-bottom: 0.5em;">')
      .replace(/<pre><code.*?>/g, '<pre style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 1em 0; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.9em; border: 1px solid #e2e8f0;"><code>')
      .replace(/<code>/g, '<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #dc2626;">')
      .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #ea580c; padding-left: 16px; color: #475569; margin: 1em 0; font-style: italic;">');

    return `
      <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: white;">
        <h1 style="color: #ea580c; font-size: 2em; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
          ${modName}
        </h1>
        <div style="font-size: 15px;">
          ${htmlContent}
        </div>
      </div>
    `;
  };

  const downloadModulePDF = async (moduleName) => {
    const text = state.generated_content[moduleName];
    if (!text) return;
    
    const htmlString = buildPDFHtml(moduleName, text);

    const opt = {
      margin:       15,
      filename:     `${cleanFilename(moduleName)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(htmlString).set(opt).save();
  };

  // Master Zip downloads
  const triggerZipDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllMDZip = async () => {
    if (!state.generated_content) return;
    const zip = new JSZip();
    for (const [mod, text] of Object.entries(state.generated_content)) {
      zip.file(`${cleanFilename(mod)}.md`, text);
    }
    const blob = await zip.generateAsync({type:"blob"});
    triggerZipDownload(blob, `${cleanFilename(state.course_title)}_markdowns.zip`);
  };

  const downloadAllPDFZip = async () => {
    if (!state.generated_content) return;
    const zip = new JSZip();
    for (const [mod, mdText] of Object.entries(state.generated_content)) {
      const htmlString = buildPDFHtml(mod, mdText);
      
      const opt = {
        margin:       15,
        filename:     `${cleanFilename(mod)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().from(htmlString).set(opt).output('blob');
      zip.file(`${cleanFilename(mod)}.pdf`, pdfBlob);
    }
    const blob = await zip.generateAsync({type:"blob"});
    triggerZipDownload(blob, `${cleanFilename(state.course_title)}_pdfs.zip`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4" style={{maxWidth: '1200px', margin: '0 auto'}}>
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-glow-orange" style={{ fontSize: '3rem', marginBottom: '8px' }}>⚡ Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>What are we conquering today?</p>
      </div>

      <div className="grid-cards" style={{ marginBottom: '40px' }}>
        <div className="glass-card flex-col">
          <BooksIcon />
          <div className="metric-value">{state.xp} ⚡</div>
          <div className="metric-label">Total XP</div>
        </div>
        <div className="glass-card flex-col">
          <ClockIcon />
          <div className="metric-value">{totalQuizzes}</div>
          <div className="metric-label">Quizzes Done</div>
        </div>
        <div className="glass-card flex-col">
          <ChartIcon />
          <div className="metric-value">{avgScore > 0 ? `${avgScore}%` : '—'}</div>
          <div className="metric-label">Avg. Score</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--accent-orange)" /> Start a New Journey
        </h3>
        <form onSubmit={handleGenerateCourse} style={{ display: 'flex', gap: '16px' }}>
          <input 
            className="input-modern"
            placeholder="e.g. Machine Learning, Quantum Computing, Design..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap:'8px' }}>
            {loading ? <Loader2 className="animate-spin" /> : "Generate Curriculum 🚀"}
          </button>
        </form>
      </div>

      {state.roadmap && state.roadmap.length > 0 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.2}}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>📚 {state.course_title}</h2>
          <div style={{ marginBottom: '24px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-orange), var(--accent-red))' }}
              initial={{ width: 0 }}
              animate={{ width: `${(Object.keys(state.generated_content || {}).length / state.roadmap.length) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut'}}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {state.roadmap.map((mod, idx) => {
              const isGenerated = !!state.generated_content?.[mod];
              const isLoading = activeModuleLoading === mod;
              const isExpanded = expandedModule === mod;

              return (
                <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap:'wrap', gap:'12px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing:'0.05em' }}>Module {idx + 1}</h4>
                      <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{mod}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {isGenerated ? (
                        <>
                          <button className="btn-secondary" onClick={() => setExpandedModule(isExpanded ? null : mod)} style={{display:'flex', gap:8, alignItems:'center', padding:'8px 16px', background:'var(--bg-secondary)'}}>
                            📖 Read Lesson {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                          <span style={{ display:'flex', alignItems:'center', gap:'6px', color: 'var(--accent-green)', fontWeight: 600, padding:'0 10px' }}>
                            <CheckCircle size={18} /> Ready
                          </span>
                        </>
                      ) : (
                        <button onClick={() => generateContent(mod)} className="btn-secondary" disabled={isLoading} style={{display:'flex', gap:'8px', alignItems:'center'}}>
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : "📝 Write Lesson"}
                        </button>
                      )}
                      
                      {isGenerated && (
                        <button className="btn-primary" onClick={() => navigate('/quiz', { state: { module: mod } })}>
                          🧪 Challenge
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && isGenerated && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        style={{ overflow: 'hidden', marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}
                      >
                        <div style={{display:'flex', gap:10, marginBottom: 20}}>
                          <button className="btn-secondary" style={{padding:'6px 14px', fontSize:'0.9rem'}} onClick={() => downloadModuleMD(mod)}><FileText size={14} style={{display:'inline', marginRight:6}}/> .MD </button>
                          <button className="btn-secondary" style={{padding:'6px 14px', fontSize:'0.9rem'}} onClick={() => downloadModulePDF(mod)}><FileText size={14} style={{display:'inline', marginRight:6}}/> .PDF </button>
                        </div>
                        <div className="markdown-body" style={{lineHeight: 1.8, fontSize: '1.05rem'}}>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{state.generated_content[mod]}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          
          {Object.keys(state.generated_content || {}).length > 0 && (
             <div className="glass-card" style={{marginTop: 32, display:'flex', gap:20, flexWrap:'wrap', alignItems:'center'}}>
               <strong style={{color:'var(--text-secondary)'}}>Export Course Hub:</strong>
               <button className="btn-secondary" onClick={downloadAllMDZip} style={{display:'flex', alignItems:'center', gap:8}}>
                 <FileArchive size={18}/> Download All Markdown (ZIP)
               </button>
               <button className="btn-secondary" onClick={downloadAllPDFZip} style={{display:'flex', alignItems:'center', gap:8}}>
                 <FileArchive size={18}/> Download All PDF (ZIP)
               </button>
             </div>
          )}

        </motion.div>
      )}
    </motion.div>
  );
}

// Minimal inline icons for dashboard cards
const ChartIcon = () => <div style={{ background:'var(--accent-green-dim)', padding:'12px', borderRadius:'12px', display:'inline-block', marginBottom:'16px' }}><BarChart2 color="var(--accent-green)" /></div>;
const BooksIcon = () => <div style={{ background:'var(--accent-orange-dim)', padding:'12px', borderRadius:'12px', display:'inline-block', marginBottom:'16px' }}><BookOpen color="var(--accent-orange)" /></div>;
const ClockIcon = () => <div style={{ background:'var(--accent-blue-dim)', padding:'12px', borderRadius:'12px', display:'inline-block', marginBottom:'16px' }}><Clock color="var(--accent-blue)" /></div>;

// Global animation override utility for react spinners
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin { animation: spin 1s linear infinite; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-bottom: 16px; margin-top: 24px; color: var(--accent-orange); }
  .markdown-body pre { background: #000; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
  .markdown-body p { margin-bottom: 16px; }
  .markdown-body ul, .markdown-body ol { margin-left: 24px; margin-bottom: 16px; }
`;
document.head.appendChild(style);
