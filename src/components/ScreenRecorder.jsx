import React, { useRef, useState, useEffect } from 'react';
import { mediaManager } from '../utils/MediaManager';
import { storageManager } from '../utils/StorageManager';

const ScreenRecorder = () => {
    const videoPreviewRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle');
    const [screenStream, setScreenStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);

    const mediaRecorderRef = useRef(null);

    useEffect(() => {
        return () => {
            stopAll();
        };
    }, []);

    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
            if (!audioStream) setStatus('idle');
            return;
        }

        try {
            console.log('Requesting screen stream...');
            const stream = await mediaManager.getScreenStream();
            setScreenStream(stream);
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
            }

            stream.getVideoTracks()[0].onended = () => {
                setScreenStream(null);
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
            if (!screenStream) setStatus('idle');
            return;
        }

        try {
            console.log('Requesting mic stream...');
            const stream = await mediaManager.getAudioStream();
            setAudioStream(stream);
            setStatus('ready');
        } catch (err) {
            console.error('Error starting mic stream:', err);
            alert(`Could not acquire microphone: ${err.message}`);
        }
    };

    const getSupportedMimeType = () => {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    };

    const startRecording = async () => {
        try {
            if (!screenStream) {
                alert('Please enable the screen first.');
                return;
            }

            console.log('Starting hardware-direct recording (mixing tracks)...');

            // Create a combined stream for recording
            const combinedStream = new MediaStream();

            // Add video track from screen
            screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

            // Add audio track from microphone if available
            if (audioStream) {
                audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
                console.log('Microphone audio track added to recording');
            }

            const mimeType = getSupportedMimeType();
            const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    storageManager.saveChunk(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const chunks = await storageManager.getAllChunks();
                if (chunks.length === 0) return;

                const blob = new Blob(chunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${Date.now()}.webm`;
                a.click();
                await storageManager.clearStorage();
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setStatus('recording');
        } catch (err) {
            console.error('Recording failed:', err);
            setStatus('error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setStatus('ready');
    };

    const stopAll = () => {
        if (screenStream) screenStream.getTracks().forEach(track => track.stop());
        if (audioStream) audioStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
        setAudioStream(null);
        setStatus('idle');
    };

    return (
        <div className="recorder-container">
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Stability Phase: Direct Capture + Audio</h2>

            <div className="preview-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {screenStream ? (
                    <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Screen share inactive</div>
                )}

                {status === 'recording' && (
                    <div className="status-badge status-recording">
                        <span className="status-dot"></span>
                        Recording {audioStream ? '(Mic On)' : '(Mic Off)'}
                    </div>
                )}
            </div>

            <div className="controls-panel">
                <div style={{ display: 'flex', gap: '0.5rem', borderRight: '1px solid var(--glass-border)', paddingRight: '0.5rem', marginRight: '0.5rem' }}>
                    <button
                        className={`btn ${screenStream ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleScreen}
                        disabled={isRecording}
                    >
                        {screenStream ? 'Disable Screen' : 'Enable Screen'}
                    </button>
                    <button
                        className={`btn ${audioStream ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleMic}
                        disabled={isRecording}
                    >
                        {audioStream ? 'Disable Mic' : 'Enable Mic'}
                    </button>
                </div>

                {screenStream && (
                    <button
                        className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                )}

                {(screenStream || audioStream) && (
                    <button className="btn btn-outline" onClick={stopAll} disabled={isRecording}>
                        Reset All
                    </button>
                )}
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
                Status: {status.toUpperCase()} | 0-Lag Hardware Mix Mode
            </div>
        </div>
    );
};

export default ScreenRecorder;
