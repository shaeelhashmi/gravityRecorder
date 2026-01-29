import { useState, useCallback } from 'react';
import { mediaManager } from '../utils/MediaManager';

export const useStreams = (screenVideoRef, cameraVideoRef, setStatus) => {
    const [screenStream, setScreenStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);

    const stopAll = useCallback(() => {
        [screenStream, cameraStream, audioStream].forEach(s => {
            s?.getTracks().forEach(t => t.stop());
        });
        setScreenStream(null);
        setCameraStream(null);
        setAudioStream(null);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
        setStatus('idle');
    }, [screenStream, cameraStream, audioStream, screenVideoRef, cameraVideoRef, setStatus]);

    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
            return;
        }

        try {
            const stream = await mediaManager.getScreenStream();
            setScreenStream(stream);
            if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;

            // Explicitly play to ensure readyState progresses
            await screenVideoRef.current?.play().catch(e => console.warn('Screen video play delayed:', e));

            stream.getVideoTracks()[0].onended = () => {
                setScreenStream(null);
                if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
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
            if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
            return;
        }

        try {
            const stream = await mediaManager.getCameraStream();
            setCameraStream(stream);
            if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;

            // Explicitly play
            await cameraVideoRef.current?.play().catch(e => console.warn('Camera video play delayed:', e));

            setStatus('ready');
        } catch (err) {
            console.error('Error starting camera stream:', err);
            alert(`Could not acquire camera: ${err.message}`);
        }
    };

    return {
        screenStream,
        audioStream,
        cameraStream,
        toggleScreen,
        toggleMic,
        toggleCamera,
        stopAll
    };
};
