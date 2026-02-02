import React from 'react';
import { BACKGROUND_PRESETS } from '../../constants/backgrounds';

export const ControlBar = ({
    screenStream,
    cameraStream,
    audioStream,
    activeBg,
    isRecording,
    isBgPanelOpen,
    setIsBgPanelOpen,
    webcamShape,
    setWebcamShape,
    webcamScale,
    setWebcamScale,
    screenScale,
    setScreenScale,
    toggleScreen,
    toggleCamera,
    toggleMic,
    setActiveBg,
    recordingQuality,
    setRecordingQuality,
    qualityPresets,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isPaused,
    handleStopAll
}) => {
    const [isQualityOpen, setIsQualityOpen] = React.useState(false);

    return (
        <div className="control-bar-container">
            {cameraStream && !isRecording && (
                <div className="camera-dropdown glass-card">
                    <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="setting-label">Webcam Frame</span>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {['circle', 'rounded-rect', 'square'].map(s => (
                                    <button key={s} onClick={() => setWebcamShape(s)}
                                        className={`btn-icon ${webcamShape === s ? 'active' : ''}`}
                                        title={s}>
                                        <div className={`shape-preview ${s}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--glass-border)' }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="setting-label">Webcam Size</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { label: 'S', val: 0.25 },
                                    { label: 'M', val: 0.40 },
                                    { label: 'L', val: 0.55 }
                                ].map(s => (
                                    <button key={s.label} onClick={() => setWebcamScale(s.val)}
                                        className={`btn-small ${webcamScale === s.val ? 'active' : ''}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isBgPanelOpen && !isRecording && (
                <div className="camera-dropdown glass-card">
                    <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="setting-label">Aesthetic Gradients</span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '280px' }}>
                                {BACKGROUND_PRESETS.map(p => (
                                    <button key={p.id}
                                        onClick={() => setActiveBg(p.id)}
                                        className={`btn-icon ${activeBg === p.id ? 'active' : ''}`}
                                        title={p.name}
                                        style={{
                                            background: p.colors ? `linear-gradient(135deg, ${p.colors.join(', ')})` : 'var(--bg-card)',
                                            border: activeBg === p.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                            overflow: 'hidden'
                                        }}>
                                        {p.id === 'none' && <span style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 700 }}>Black</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--glass-border)' }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="setting-label">Screen Layout</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { label: 'Full', val: 1.0 },
                                    { label: 'Framed', val: 0.90 },
                                    { label: 'Compact', val: 0.82 }
                                ].map(s => (
                                    <button key={s.label} onClick={() => setScreenScale(s.val)}
                                        className={`btn-small ${screenScale === s.val ? 'active' : ''}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {screenScale < 1.0 ? '✨ Premium Frame Active' : 'Basic Fullscreen'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {isQualityOpen && !isRecording && (
                <div className="camera-dropdown glass-card">
                    <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span className="setting-label">Recording Quality</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {Object.entries(qualityPresets).map(([key, val]) => (
                                    <button key={key} onClick={() => setRecordingQuality(key)}
                                        className={`btn-small ${recordingQuality === key ? 'active' : ''}`}>
                                        {val.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="control-bar">
                <div className="source-toggles">
                    <button className={`btn-pill ${screenStream ? 'active' : ''}`}
                        onClick={toggleScreen} disabled={isRecording}>
                        {screenStream ? '● Screen' : 'Screen'}
                    </button>
                    <button className={`btn-pill ${cameraStream ? 'active' : ''}`}
                        onClick={() => {
                            toggleCamera();
                            if (!cameraStream) setIsBgPanelOpen(false);
                        }} disabled={isRecording}>
                        {cameraStream ? '● Camera' : 'Camera'}
                    </button>
                    <button className={`btn-pill ${audioStream ? 'active' : ''}`}
                        onClick={toggleMic} disabled={isRecording}>
                        {audioStream ? '● Mic' : 'Mic'}
                    </button>
                    <div className="vertical-divider" style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                    <button className={`btn-pill ${activeBg !== 'none' || screenScale !== 1.0 ? 'active' : ''}`}
                        onClick={() => {
                            setIsBgPanelOpen(!isBgPanelOpen);
                            setIsQualityOpen(false);
                        }} disabled={isRecording}>
                        {activeBg !== 'none' || screenScale !== 1.0 ? '🎨 Styled' : '🎨 BG'}
                    </button>
                    <div className="vertical-divider" style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                    <button className={`btn-pill ${isQualityOpen ? 'active' : ''}`}
                        onClick={() => {
                            setIsQualityOpen(!isQualityOpen);
                            setIsBgPanelOpen(false);
                        }} disabled={isRecording}>
                        ⚙️ {recordingQuality}
                    </button>
                </div>

                <div className="main-actions">
                    {(screenStream || cameraStream || activeBg !== 'none') && (
                        <>
                            {!isRecording ? (
                                <button className="btn btn-primary"
                                    onClick={startRecording}
                                    disabled={!screenStream && !cameraStream}>
                                    Start Recording
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className={`btn ${isPaused ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={isPaused ? resumeRecording : pauseRecording}
                                        style={{ minWidth: '100px', justifyContent: 'center' }}>
                                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                                    </button>
                                    <button className="btn btn-danger"
                                        onClick={stopRecording}>
                                        Stop
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    <button className="btn-icon-bg" onClick={handleStopAll} title="Reset">✕</button>
                </div>
            </div>
        </div>
    );
};
