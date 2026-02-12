import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ScreenRecorder from './components/ScreenRecorder';
import LandingPage from './components/LandingPage/LandingPage';
import BlogList from './components/Blog/BlogList';
import BlogPost from './components/Blog/BlogPost';
import ComparisonPage from './components/Marketing/ComparisonPage';
import { PrivacyPolicy, TermsOfService } from './components/Legal/LegalPages';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import './index.css';

const NavigationHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBlogPage = location.pathname.startsWith('/blog');

  return (
    <header style={{
      position: 'absolute',
      top: '2rem',
      left: '2rem',
      right: '2rem',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <div style={{
          width: '40px',
          height: '40px',
          background: 'var(--primary)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white'
        }}>G</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gravity Recorder</h1>
      </div>
      <ThemeToggle />
    </header>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/recorder" element={
              <>
                <NavigationHeader />
                <main>
                  <ScreenRecorder />
                </main>
              </>
            } />
            <Route path="/blog" element={
              <>
                <NavigationHeader />
                <BlogList />
              </>
            } />
            <Route path="/blog/:slug" element={
              <>
                <NavigationHeader />
                <BlogPost />
              </>
            } />
            <Route path="/:competitor-alternative" element={
              <>
                <NavigationHeader />
                <ComparisonPage />
              </>
            } />
            <Route path="/privacy" element={
              <>
                <NavigationHeader />
                <PrivacyPolicy />
              </>
            } />
            <Route path="/terms" element={
              <>
                <NavigationHeader />
                <TermsOfService />
              </>
            } />
          </Routes>
          <Analytics />
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
