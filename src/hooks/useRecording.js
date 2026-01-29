import { useState, useRef, useCallback } from 'react';
import { storageManager } from '../utils/StorageManager';

export const useRecording = ({
    screenStream,
    audioStream,
    cameraStream,
    activeBg,
    canvasRef,
    directoryHandle,
    syncLibrary,
    generateThumbnail,
    showToast,
    setHighlightedFile
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle');
    const mediaRecorderRef = useRef(null);

    const triggerDownload = useCallback((blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    }, []);

    const startRecording = useCallback(async () => {
        try {
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
                    const fileName = `recording-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;

                    // If folder is connected, save directly
                    if (directoryHandle) {
                        try {
                            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(blob);
                            await writable.close();
                            syncLibrary(directoryHandle); // Refresh

                            // Generate Thumbnail after save
                            generateThumbnail(blob, fileName, directoryHandle);

                            // Trigger success signals
                            showToast(`Saved to ${directoryHandle.name}`, fileName, 'success');
                            setHighlightedFile(fileName);
                            setTimeout(() => setHighlightedFile(null), 5000); // Clear highlight after 5s
                        } catch (err) {
                            console.error('Direct save failed:', err);
                            triggerDownload(blob, fileName);
                            showToast('Direct save failed', 'Download triggered as fallback', 'error');
                        }
                    } else {
                        triggerDownload(blob, fileName);
                        showToast('Recording Saved', 'Check your downloads folder', 'success');
                    }
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
    }, [screenStream, cameraStream, audioStream, activeBg, canvasRef, directoryHandle, syncLibrary, generateThumbnail, showToast, setHighlightedFile, triggerDownload]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setStatus('ready');
    }, []);

    const resetRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setStatus('idle');
    }, []);

    return {
        isRecording,
        status,
        setStatus,
        startRecording,
        stopRecording,
        resetRecording,
        mediaRecorderRef
    };
};
