import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    xp: 0,
    earned_badges: [],
    quizzes_taken: [],
    course_title: '',
    roadmap: [],
    generated_content: {},
    knowledge_gaps: [],
    strengths: [],
    gap_recommendation: ''
  });
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('AI_API_KEY') || localStorage.getItem('OPENROUTER_API_KEY') || '');
  const [devAuth, setDevAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('AI_API_KEY', apiKey);
  }, [apiKey]);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/state`);
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error("Failed to fetch state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  return (
    <AppContext.Provider value={{ state, setState, apiKey, setApiKey, devAuth, setDevAuth, fetchState, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
