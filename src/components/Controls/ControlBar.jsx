import React from 'react';
import { BACKGROUND_PRESETS } from '../../constants/backgrounds';
import { getSupportedFormats, EXPORT_FORMATS } from '../../constants/formats';
import ChevronDown from './SVG/ChevronDown';
import './Controls.css';
export const ControlBar = ({
    screenStream,
    cameraStream,
    audioStream,
    activeBg,
    isRecording,
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
    handleStopAll,
    recordingFormat,
    setRecordingFormat,
        micID,
        setMicID
}) => {
    const [activePanel, setActivePanel] = React.useState(null); // 'camera', 'bg', 'quality', 'format'
    const supportedFormats = React.useMemo(() => getSupportedFormats(), []);
    const [showMicOptions, setShowMicOptions] = React.useState(false);
    const [showCameraOptions, setShowCameraOptions] = React.useState(false);
    const [cameraOption, setCameraOption] = React.useState(''); 
    const [cameras, setCameras] = React.useState([]);
    const [microphones, setMicrophones] = React.useState([]);


    const togglePanel = (panel) => {
        setActivePanel(activePanel === panel ? null : panel);
    };

    return (
        <div className="control-bar-container">
            {/* Unified Settings Popover */}
            {activePanel && !isRecording && (
                <div className="settings-popover">
                    {activePanel === 'camera' && (
                        <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span className="setting-label">Webcam Frame</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {['circle', 'rounded-rect', 'square'].map(s => (
                                        <button key={s} onClick={() => { console.log('Shape clicked:', s); setWebcamShape(s); }}
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
                                        <button key={s.label} onClick={() => { console.log('Size clicked:', s.val); setWebcamScale(s.val); }}
                                            className={`btn-small ${webcamScale === s.val ? 'active' : ''}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePanel === 'bg' && (
                        <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <span className="setting-label">Aesthetic Gradients</span>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '0.6rem',
                                    width: 'fit-content'
                                }}>
                                    {BACKGROUND_PRESETS.map(p => (
                                        <button key={p.id}
                                            onClick={() => { console.log('BG clicked:', p.id); setActiveBg(p.id); }}
                                            className={`btn-icon ${activeBg === p.id ? 'active' : ''}`}
                                            title={p.name}
                                            style={{
                                                background: p.colors ? `linear-gradient(135deg, ${p.colors.join(', ')})` : 'var(--bg-card)',
                                                border: activeBg === p.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                                overflow: 'hidden',
                                                width: '40px',
                                                height: '40px'
                                            }}>
                                            {p.id === 'none' && <span style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 700 }}>None</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '120px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: '180px' }}>
                                <span className="setting-label">Screen Layout</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {[
                                        { label: 'Full Display', val: 1.0, desc: 'Maximum visibility' },
                                        { label: 'Framed View', val: 0.90, desc: 'Elegant margins' },
                                        { label: 'Compact', val: 0.82, desc: 'Focus on webcam' }
                                    ].map(s => (
                                        <button key={s.label} onClick={() => { console.log('Layout clicked:', s.val); setScreenScale(s.val); }}
                                            className={`btn-small ${screenScale === s.val ? 'active' : ''}`}
                                            style={{ justifyContent: 'space-between', padding: '0.6rem 1rem', width: '100%' }}>
                                            <span>{s.label}</span>
                                            {screenScale === s.val && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePanel === 'quality' && (
                        <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span className="setting-label">Recording Quality</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {Object.entries(qualityPresets).map(([key, val]) => (
                                        <button key={key} onClick={() => { console.log('Quality clicked:', key); setRecordingQuality(key); }}
                                            className={`btn-small ${recordingQuality === key ? 'active' : ''}`}>
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePanel === 'format' && (
                        <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span className="setting-label">Export Format</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {supportedFormats.map(f => (
                                        <button key={f.id} onClick={() => { console.log('Format clicked:', f.id); setRecordingFormat(f.id); }}
                                            className={`btn-small ${recordingFormat === f.id ? 'active' : ''}`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button className="popover-close" onClick={() => { console.log('Closing panel'); setActivePanel(null); }}>✕</button>
                </div>
            )}

            <div className="control-bar">
                <div className="source-toggles">
                    <button className={`btn-pill ${screenStream ? 'active' : ''}`}
                        onClick={toggleScreen} disabled={isRecording}>
                        {screenStream ? '● Screen' : 'Screen'}
                    </button>
                    <div className="grid">
                    <button className={`btn-pill ${cameraStream ? 'active' : ''}`}
                        onClick={async() => {
                            if (!cameraStream) {
                                await toggleCamera();
                                const devices = await navigator.mediaDevices.enumerateDevices();
                                const cameras = devices.filter(d => d.kind === 'videoinput');
                                setCameras(cameras);
                                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                                const activeTrack = stream.getVideoTracks()[0];
                                const settings = activeTrack.getSettings();

                                // `deviceId` of the camera actually in use
                                const defaultCameraId = settings.deviceId;

                                setCameraOption(defaultCameraId);
                                setActivePanel('camera'); // Auto-open settings when turning on
                            } else {
                                // If already on, treat as a toggle for the panel
                                if (activePanel === 'camera') {
                                    setActivePanel(null);
                                } else {
                                    setActivePanel('camera');
                                }
                            }
                        }} disabled={isRecording}>
                        {cameraStream ? '● Camera' : 'Camera'}
                    </button>
                         <button className="dropDownBtn" onClick={()=>{
                        setShowCameraOptions(!showCameraOptions)
                    }}
                    disabled={isRecording}>
                            <ChevronDown/>
                    </button>
                    {
                        showCameraOptions && (
                            <div style={{ position:'absolute',top:'4rem',background:'#1f2537',borderRadius:'10px',padding:'0.8rem',zIndex:20,width:'150px',left:'6rem'}}>
                                <div  >
                                    {cameras.map(type => (
                                        <>
                                            <button key={type.deviceId} onClick={() => setCameraOption(type.deviceId)}
                                                className={`btn-small  ${cameraOption === type.deviceId ? 'active' : ''}`}
                                                style={{ margin: '5px',color:'#94a3b8' ,width:'100%',border:0}}>
                                                {type.label}
                                            </button>
                                        </>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    </div>
                     <div className='grid'>
                    <button className={`btn-pill ${audioStream ? 'active' : ''}`}
                    onClick={async ()=>{
                    try{
                    await toggleMic()
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const audioInputs = devices.filter(device => device.kind === 'audioinput');
                    
                    setMicrophones(audioInputs);

                    if(micID === ''){ 
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const track = stream.getAudioTracks()[0];
                    setMicID(audioInputs.find(d => d.deviceId === track.
                    getSettings().deviceId).deviceId || 'system');            
                    }
                    }
                    catch(err){
                        console.error('Error toggling mic:', err);
                    }
                    }} disabled={isRecording} >
                        {audioStream ? '● Mic' : 'Mic'}
                    </button>
                    <button className="dropDownBtn" onClick={()=>{
                        setShowMicOptions(!showMicOptions)
                    }} disabled={isRecording}>
                            <ChevronDown/>
                    </button>
                      {
                        showMicOptions && (
                            <div style={{ position:'absolute',top:'4rem',background:'#1f2537',borderRadius:'10px',padding:'0.8rem',zIndex:20,width:'150px'}}>
                                <div  >
                                    {microphones.map(type => (
                                        <li key={type.deviceId} style={{ listStyle: 'none' }}>
                                            <button key={type.deviceId} onClick={() => {setMicID(type.deviceId)
                                                console.log('Selected mic:', type.label, type.deviceId);
                                            }}
                                                className={`btn-small  ${micID === type.deviceId ? 'active' : ''}`}
                                                style={{ margin: '5px',color:'#94a3b8' ,width:'100%',border:0}}>
                                                {type.label}
                                            </button>   
                        
                                        </li>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    </div>
                    <div className="vertical-divider" style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                    <button className={`btn-pill ${activeBg !== 'none' || screenScale !== 1.0 || activePanel === 'bg' ? 'active' : ''}`}
                        onClick={() => togglePanel('bg')} disabled={isRecording}>
                        {activeBg !== 'none' || screenScale !== 1.0 ? '🎨 Styled' : '🎨 BG'}
                    </button>
                    <div className="vertical-divider" style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                    <button className={`btn-pill ${activePanel === 'format' ? 'active' : ''}`}
                        onClick={() => togglePanel('format')} disabled={isRecording}>
                        🎬 {EXPORT_FORMATS.find(f => f.id === recordingFormat)?.label?.split(' ')[0] || 'Format'}
                    </button>
                    <div className="vertical-divider" style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                    <button className={`btn-pill ${activePanel === 'quality' ? 'active' : ''}`}
                        onClick={() => togglePanel('quality')} disabled={isRecording}>
                        ⚙️ {recordingQuality}
                    </button>
                </div>

                <div className="main-actions">
                    {(screenStream || cameraStream || activeBg !== 'none') && (
                        <>
                            {!isRecording ? (
                                <button className="btn btn-primary"
                                    onClick={() => {
                                        setActivePanel(null);
                                        console.log('Starting recording with micID:', micID);
                                        startRecording(micID);
                                    }}
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
                    <button className="btn-icon-bg" onClick={() => { setActivePanel(null); handleStopAll(); }} title="Reset">✕</button>
                </div>
            </div>
        </div>
    );
};
