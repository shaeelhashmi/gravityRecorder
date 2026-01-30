import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ScreenRecorder from './components/ScreenRecorder';
import LandingPage from './components/LandingPage/LandingPage';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

const NavigationHeader = () => {
  const navigate = useNavigate();
  return (
    <header style={{
      position: 'absolute',
      top: '2rem',
      left: '2rem',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
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
        cursor: 'pointer'
      }} onClick={() => navigate('/')}>G</div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gravity Recorder</h1>
    </header>
  );
};

function App() {
  return (
    <Router>
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
        </Routes>
        <Analytics />
      </div>
    </Router>
  );
}

export default App;
