import { useState, useRef, useCallback } from 'react';
import { storageManager } from '../utils/StorageManager';

export const useRecording = ({
    screenStream,
    audioStream,
    cameraStream,
    activeBg,
    canvasRef,
    bitrate = 8000000,
    onComplete
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [status, setStatus] = useState('idle');
    const mediaRecorderRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                console.warn('Recording already in progress');
                return;
            }

            if (!screenStream && !cameraStream) {
                alert('Enable Screen or Camera first');
                return;
            }

            console.log('Finalizing stream for MediaRecorder...');
            const tracks = [];

            // Case A: Webcam is active OR Background is selected (requires canvas for bubble/frame)
            if (cameraStream || activeBg !== 'none') {
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

            const types = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
            const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';

            const mediaRecorder = new MediaRecorder(recordingStream, {
                mimeType,
                videoBitsPerSecond: bitrate,
                audioBitsPerSecond: 128000
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) storageManager.saveChunk(e.data);
            };

            mediaRecorder.onstop = async () => {
                setStatus('processing');
                const chunks = await storageManager.getAllChunks();
                if (chunks.length > 0) {
                    const blob = new Blob(chunks, { type: mimeType });
                    if (onComplete) {
                        onComplete(blob, mimeType);
                    }
                }
                await storageManager.clearStorage();
                setStatus('ready');
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setStatus('recording');
        } catch (err) {
            console.error('Recording start failed:', err);
            setStatus('error');
        }
    }, [screenStream, cameraStream, audioStream, activeBg, canvasRef, bitrate, onComplete]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            setStatus('paused');
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            setStatus('recording');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        setStatus('ready');
    }, []);

    const resetRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        setStatus('idle');
    }, []);

    return {
        isRecording,
        isPaused,
        status,
        setStatus,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
        mediaRecorderRef
    };
};
