import React, { useRef, useState, useEffect } from 'react';
import { mediaManager } from '../utils/MediaManager';
import { storageManager } from '../utils/StorageManager';

const ScreenRecorder = () => {
    const videoPreviewRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle');
    const [screenStream, setScreenStream] = useState(null);

    const mediaRecorderRef = useRef(null);

    const startScreenStream = async () => {
        try {
            setStatus('initializing');
            console.log('Requesting raw screen stream...');
            const stream = await mediaManager.getScreenStream();

            setScreenStream(stream);
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream;
            }

            stream.getVideoTracks()[0].onended = () => {
                stopAll();
            };

            setStatus('ready');
        } catch (err) {
            console.error('Error starting screen stream:', err);
            setStatus('error');
            alert(`Could not acquire screen: ${err.message}`);
        }
    };

    const getSupportedMimeType = () => {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
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
            if (!screenStream) return;

            console.log('Starting direct MediaStream recording (No Canvas overhead)...');
            const mimeType = getSupportedMimeType();

            // Record the STREAM directly, not the canvas
            const mediaRecorder = new MediaRecorder(screenStream, { mimeType });
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
                a.download = `direct-recording-${Date.now()}.webm`;
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
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setStatus('idle');
    };

    return (
        <div className="recorder-container">
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Performance Mode: Direct Stream</h2>

            <div className="preview-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {status === 'recording' && (
                    <div className="status-badge status-recording">
                        <span className="status-dot"></span>
                        Recording Directly (0 Canvas Overhead)
                    </div>
                )}
            </div>

            <div className="controls-panel">
                {status === 'idle' ? (
                    <button className="btn btn-primary" onClick={startScreenStream}>
                        1. Select Screen
                    </button>
                ) : (
                    <>
                        <button
                            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? 'Stop Recording' : '2. Start Recording'}
                        </button>
                        <button className="btn btn-outline" onClick={stopAll}>
                            Reset
                        </button>
                    </>
                )}
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
                Status: {status.toUpperCase()} | Bypassing Canvas for maximum framerate.
            </div>
        </div>
    );
};

export default ScreenRecorder;
