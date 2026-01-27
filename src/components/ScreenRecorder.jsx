import React, { useRef, useState, useEffect } from 'react';
import { mediaManager } from '../utils/MediaManager';
import { storageManager } from '../utils/StorageManager';

const ScreenRecorder = () => {
    const canvasRef = useRef(null);
    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle');
    const [screenStream, setScreenStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);

    const mediaRecorderRef = useRef(null);
    const drawTimerRef = useRef(null);

    // Initialize hidden video elements
    useEffect(() => {
        screenVideoRef.current = document.createElement('video');
        screenVideoRef.current.muted = true;
        screenVideoRef.current.autoplay = true;
        screenVideoRef.current.playsInline = true;

        cameraVideoRef.current = document.createElement('video');
        cameraVideoRef.current.muted = true;
        cameraVideoRef.current.autoplay = true;
        cameraVideoRef.current.playsInline = true;

        return () => {
            stopAll();
        };
    }, []);

    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            screenVideoRef.current.srcObject = null;
            return;
        }

        try {
            const stream = await mediaManager.getScreenStream();
            setScreenStream(stream);
            screenVideoRef.current.srcObject = stream;

            // Explicitly play to ensure readyState progresses
            await screenVideoRef.current.play().catch(e => console.warn('Screen video play delayed:', e));

            stream.getVideoTracks()[0].onended = () => {
                setScreenStream(null);
                screenVideoRef.current.srcObject = null;
            };

            setStatus('ready');
        } catch (err) {
            console.error('Error starting screen stream:', err);
            alert(`Could not acquire screen: ${err.message}`);
        }
    };

    const toggleMic = async () => {
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            setAudioStream(null);
            return;
        }

        try {
            const stream = await mediaManager.getAudioStream();
            setAudioStream(stream);
            setStatus('ready');
        } catch (err) {
            console.error('Error starting mic stream:', err);
            alert(`Could not acquire microphone: ${err.message}`);
        }
    };

    const toggleCamera = async () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            cameraVideoRef.current.srcObject = null;
            return;
        }

        try {
            const stream = await mediaManager.getCameraStream();
            setCameraStream(stream);
            cameraVideoRef.current.srcObject = stream;

            // Explicitly play
            await cameraVideoRef.current.play().catch(e => console.warn('Camera video play delayed:', e));

            setStatus('ready');
        } catch (err) {
            console.error('Error starting camera stream:', err);
            alert(`Could not acquire camera: ${err.message}`);
        }
    };

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!screenStream && !cameraStream) {
                if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
                return;
            }

            // Sync canvas size to screen if possible
            if (screenStream && screenVideoRef.current.readyState >= 2) {
                if (canvas.width !== screenVideoRef.current.videoWidth || canvas.height !== screenVideoRef.current.videoHeight) {
                    canvas.width = screenVideoRef.current.videoWidth || 1280;
                    canvas.height = screenVideoRef.current.videoHeight || 720;
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Screen (Background)
            if (screenStream && screenVideoRef.current.readyState >= 2) {
                ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Draw Camera Bubble
            if (cameraStream && cameraVideoRef.current.readyState >= 2) {
                const bubbleSize = Math.min(canvas.width, canvas.height) * 0.25;
                const margin = 20;
                const bx = margin;
                const by = canvas.height - bubbleSize - margin;

                ctx.save();
                ctx.beginPath();
                ctx.arc(bx + bubbleSize / 2, by + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                // Aspect ratio correction for bubble
                const vWidth = cameraVideoRef.current.videoWidth;
                const vHeight = cameraVideoRef.current.videoHeight;
                const vAspect = vWidth / vHeight;

                let dw, dh, dx, dy;
                if (vAspect > 1) {
                    dw = bubbleSize * vAspect;
                    dh = bubbleSize;
                    dx = bx - (dw - bubbleSize) / 2;
                    dy = by;
                } else {
                    dw = bubbleSize;
                    dh = bubbleSize / vAspect;
                    dx = bx;
                    dy = by - (dh - bubbleSize) / 2;
                }

                ctx.drawImage(cameraVideoRef.current, dx, dy, dw, dh);
                ctx.restore();

                ctx.strokeStyle = '#646cff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Continue loop if active
            if (cameraStream || screenStream) {
                drawTimerRef.current = setTimeout(draw, 1000 / 30);
            }
        };

        if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        draw();
    };

    // Trigger canvas loop when sources change
    useEffect(() => {
        if (cameraStream || screenStream) {
            drawCanvas();
        } else {
            if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        }
    }, [cameraStream, screenStream]);

    const startRecording = async () => {
        try {
            if (!screenStream && !cameraStream) {
                alert('Enable Screen or Camera first');
                return;
            }

            console.log('Finalizing stream for MediaRecorder...');
            const tracks = [];

            // Case A: Webcam is active (requires canvas for bubble)
            if (cameraStream) {
                const canvasStream = canvasRef.current.captureStream(30);
                tracks.push(...canvasStream.getVideoTracks());
            }
            // Case B: Screen only (Direct mode for better performance)
            else if (screenStream) {
                tracks.push(...screenStream.getVideoTracks());
            }

            // Add Audio track if available
            if (audioStream) {
                tracks.push(...audioStream.getAudioTracks());
            }

            const recordingStream = new MediaStream(tracks);

            const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
            const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';

            const mediaRecorder = new MediaRecorder(recordingStream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) storageManager.saveChunk(e.data);
            };

            mediaRecorder.onstop = async () => {
                const chunks = await storageManager.getAllChunks();
                if (chunks.length > 0) {
                    const blob = new Blob(chunks, { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `recording-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
                    a.click();
                }
                await storageManager.clearStorage();
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setStatus('recording');
        } catch (err) {
            console.error('Recording start failed:', err);
            setStatus('error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
        setStatus('ready');
    };

    const stopAll = () => {
        if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();

        [screenStream, cameraStream, audioStream].forEach(s => {
            if (s) s.getTracks().forEach(t => t.stop());
        });

        setScreenStream(null);
        setCameraStream(null);
        setAudioStream(null);
        setStatus('idle');
    };

    return (
        <div className="recorder-container">
            <h2 style={{ color: 'var(--primary)' }}>Stability Phase: Direct + Bubble (Debug)</h2>

            <div className="preview-wrapper">
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="preview-canvas"
                    style={{ display: (cameraStream || screenStream) ? 'block' : 'none' }}
                />
                {!cameraStream && !screenStream && (
                    <div className="preview-placeholder">Sources Inactive</div>
                )}

                {status === 'recording' && (
                    <div className="status-badge status-recording">
                        <span className="status-dot"></span>
                        REC {cameraStream ? 'BUBBLE' : 'DIRECT'}
                    </div>
                )}
            </div>

            <div className="controls-panel">
                <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                    <button className={`btn ${screenStream ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleScreen} disabled={isRecording}>
                        {screenStream ? 'Screen Off' : 'Screen On'}
                    </button>
                    <button className={`btn ${cameraStream ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleCamera} disabled={isRecording}>
                        {cameraStream ? 'Cam Off' : 'Cam On'}
                    </button>
                    <button className={`btn ${audioStream ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleMic} disabled={isRecording}>
                        {audioStream ? 'Mic Off' : 'Mic On'}
                    </button>
                </div>

                {(screenStream || cameraStream) && (
                    <button className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                        onClick={isRecording ? stopRecording : startRecording}>
                        {isRecording ? 'Stop' : 'Start Recording'}
                    </button>
                )}

                <button className="btn btn-outline" onClick={stopAll}>Reset</button>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                Mode: {cameraStream ? 'Canvas (Optimized)' : 'Direct (Zero Lag)'}
            </div>
        </div>
    );
};

export default ScreenRecorder;
