import React from 'react';
import ScreenRecorder from './components/ScreenRecorder';
import './index.css';

function App() {
  return (
    <div className="App">
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
          fontWeight: 'bold'
        }}>G</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gravity Recorder</h1>
      </header>

      <main>
        <ScreenRecorder />
      </main>
    </div>
  );
}

export default App;
