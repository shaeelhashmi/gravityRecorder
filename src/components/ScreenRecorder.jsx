import React, { useRef, useState, useEffect, useCallback } from 'react';
import { storageManager } from '../utils/StorageManager';
import { BACKGROUND_PRESETS } from '../constants/backgrounds';
import { useStreams } from '../hooks/useStreams';
import { useFileSystem } from '../hooks/useFileSystem';
import { useGoogleSync } from '../hooks/useGoogleSync';
import { useRecording } from '../hooks/useRecording';
import { EXPORT_FORMATS, getDefaultFormat } from '../constants/formats';

// UI Components
import { ControlBar } from './Controls/ControlBar';
import { HistorySidebar } from './Sidebar/HistorySidebar';
import { PreviewStage } from './Preview/PreviewStage';
import { Toast } from './Notifications/Toast';
import { VideoPlayerModal } from './Modals/VideoPlayerModal';
import SaveRecordingModal from './Modals/SaveRecordingModal';

const QUALITY_PRESETS = {
    '720p': { width: 1280, height: 720, label: '720p (HD)', bitrate: 4000000 },
    '1080p': { width: 1920, height: 1080, label: '1080p (FHD)', bitrate: 8000000 },
    '1440p': { width: 2560, height: 1440, label: '1440p (2K)', bitrate: 12000000 }
};

const ScreenRecorder = () => {
    // Refs for Media & Stage
    const canvasRef = useRef(null);
    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const {
        screenStream, audioStream, cameraStream,
        toggleScreen, toggleMic, toggleCamera, stopAll: stopStreams
    } = useStreams(screenVideoRef, cameraVideoRef, setStatus);

    const [webcamShape, setWebcamShape] = useState('circle');
    const [webcamScale, setWebcamScale] = useState(0.40);
    const [activeBg, setActiveBg] = useState('none');
    const [screenScale, setScreenScale] = useState(1.0);
    const [recordingQuality, setRecordingQuality] = useState('1080p');
    const [isBgPanelOpen, setIsBgPanelOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [highlightedFile, setHighlightedFile] = useState(null);
    const [pendingRecording, setPendingRecording] = useState(null);
    const [recordingFormat, setRecordingFormat] = useState(getDefaultFormat());
    const [countdown, setCountdown] = useState(null);

    const showToast = useCallback((title, message, type = 'info') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const {
        directoryHandle, setDirectoryHandle,
        isHandleAuthorized, setIsHandleAuthorized,
        libraryFiles, setLibraryFiles,
        thumbnailMap, setThumbnailMap,
        editingFileName, setEditingFileName,
        newName, setNewName,
        selectedVideoUrl, setSelectedVideoUrl,
        connectFolder, resumeSync, syncLibrary,
        playVideo, startRename, handleRename, deleteFile,
        generateThumbnail, getThumbnailUrl
    } = useFileSystem(showToast, setHighlightedFile);

    const {
        googleToken, cloudUser, cloudRegistry, uploadProgress,
        handleGoogleAuth, handleLogout, uploadToDrive, auditCloudRegistry,
        loadCloudMetadata, saveCloudMetadata
    } = useGoogleSync(showToast, directoryHandle);

    const {
        isRecording, isPaused, startRecording, pauseRecording, resumeRecording, stopRecording, resetRecording
    } = useRecording({
        screenStream, audioStream, cameraStream,
        activeBg, canvasRef,
        bitrate: QUALITY_PRESETS[recordingQuality].bitrate,
        mimeType: EXPORT_FORMATS.find(f => f.id === recordingFormat)?.mimeType,
        onComplete: (blob, mimeType) => setPendingRecording({ blob, mimeType })
    });

    const handleSaveRecording = async (blob, fileName) => {
        if (directoryHandle) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();

                await syncLibrary(directoryHandle);
                showToast(`Saved to ${directoryHandle.name}`, fileName, 'success');
                setHighlightedFile(fileName);

                // Background thumbnail generation to prevent UI block
                generateThumbnail(blob, fileName, directoryHandle).then(() => {
                    syncLibrary(directoryHandle);
                });

                setTimeout(() => setHighlightedFile(null), 5000);
            } catch (err) {
                console.error('Save failed:', err);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                showToast('Direct save failed', 'Download triggered as fallback', 'error');
            }
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            showToast('Recording Saved', 'Check your downloads folder', 'success');
        }
        setPendingRecording(null);
    };

    // Position State (using Ref for 0-lag updates)
    const webcamPos = useRef({ x: 20, y: 410 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
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

        return () => handleStopAll();
    }, []);

    const handleStopAll = () => {
        if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        resetRecording();
        stopStreams();
        setActiveBg('none');
        setScreenScale(1.0);
        setIsBgPanelOpen(false);
    };

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        const quality = QUALITY_PRESETS[recordingQuality];
        if (canvas.width !== quality.width || canvas.height !== quality.height) {
            canvas.width = quality.width;
            canvas.height = quality.height;
        }

        const draw = () => {
            if (!screenStream && !cameraStream && activeBg === 'none') {
                if (drawTimerRef.current) cancelAnimationFrame(drawTimerRef.current);
                return;
            }

            const bubbleSize = canvas.height * webcamScale;

            webcamPos.current.x = Math.max(0, Math.min(canvas.width - bubbleSize, webcamPos.current.x));
            webcamPos.current.y = Math.max(0, Math.min(canvas.height - bubbleSize, webcamPos.current.y));
            const { x, y } = webcamPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Background
            const preset = BACKGROUND_PRESETS.find(p => p.id === activeBg);
            if (preset && preset.colors) {
                const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                preset.colors.forEach((c, i) => grad.addColorStop(i / (preset.colors.length - 1), c));
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Draw Screen
            if (screenStream && screenVideoRef.current.readyState >= 2) {
                const sw = canvas.width * screenScale;
                const sh = canvas.height * screenScale;
                const sx = (canvas.width - sw) / 2;
                const sy = (canvas.height - sh) / 2;

                if (screenScale < 1.0) {
                    ctx.save();
                    ctx.shadowBlur = 40;
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.beginPath();
                    ctx.roundRect(sx, sy, sw, sh, 20);
                    ctx.clip();
                    ctx.drawImage(screenVideoRef.current, sx, sy, sw, sh);
                    ctx.restore();
                } else {
                    ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
                }
            }

            // 3. Draw Camera Bubble
            if (cameraStream && cameraVideoRef.current.readyState >= 2) {
                const bx = x;
                const by = y;

                ctx.save();
                ctx.beginPath();
                if (webcamShape === 'circle') {
                    ctx.arc(bx + bubbleSize / 2, by + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                } else if (webcamShape === 'rounded-rect') {
                    ctx.roundRect(bx, by, bubbleSize, bubbleSize, 32);
                } else {
                    ctx.rect(bx, by, bubbleSize, bubbleSize);
                }
                ctx.closePath();
                ctx.clip();

                const vWidth = cameraVideoRef.current.videoWidth;
                const vHeight = cameraVideoRef.current.videoHeight;
                const vAspect = vWidth / vHeight;

                let dw, dh, dx, dy;
                if (vAspect > 1) {
                    dw = bubbleSize * vAspect; dh = bubbleSize;
                    dx = bx - (dw - bubbleSize) / 2; dy = by;
                } else {
                    dw = bubbleSize; dh = bubbleSize / vAspect;
                    dx = bx; dy = by - (dh - bubbleSize) / 2;
                }

                ctx.drawImage(cameraVideoRef.current, dx, dy, dw, dh);
                ctx.restore();

                ctx.strokeStyle = '#646cff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                if (webcamShape === 'circle') {
                    ctx.arc(bx + bubbleSize / 2, by + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                } else if (webcamShape === 'rounded-rect') {
                    ctx.roundRect(bx, by, bubbleSize, bubbleSize, 32);
                } else {
                    ctx.rect(bx, by, bubbleSize, bubbleSize);
                }
                ctx.stroke();
            }

            if (cameraStream || screenStream || activeBg !== 'none') {
                drawTimerRef.current = requestAnimationFrame(draw);
            }
        };

        if (drawTimerRef.current) cancelAnimationFrame(drawTimerRef.current);
        drawTimerRef.current = requestAnimationFrame(draw);
    }, [screenStream, cameraStream, activeBg, webcamScale, screenScale, webcamShape, recordingQuality]);

    useEffect(() => {
        if (cameraStream || screenStream || activeBg !== 'none') {
            drawCanvas();
        } else {
            if (drawTimerRef.current) cancelAnimationFrame(drawTimerRef.current);
        }
    }, [cameraStream, screenStream, activeBg, webcamShape, webcamScale, screenScale, recordingQuality, drawCanvas]);

    const getCanvasMousePos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const handleMouseDown = (e) => {
        const pos = getCanvasMousePos(e);
        const canvas = canvasRef.current;
        const bubbleSize = canvas.height * webcamScale;
        const { x, y } = webcamPos.current;
        if (pos.x >= x && pos.x <= x + bubbleSize && pos.y >= y && pos.y <= y + bubbleSize) {
            isDragging.current = true;
            dragOffset.current = { x: pos.x - x, y: pos.y - y };
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const pos = getCanvasMousePos(e);
        webcamPos.current = { x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y };
    };

    const handleMouseUp = () => { isDragging.current = false; };

    useEffect(() => {
        const loadSavedState = async () => {
            const savedHandle = await storageManager.getSetting('workspace_handle');
            if (savedHandle) {
                setDirectoryHandle(savedHandle);
                const state = await savedHandle.queryPermission({ mode: 'readwrite' });
                setIsHandleAuthorized(state === 'granted');
            }
        };
        loadSavedState();
    }, [setDirectoryHandle, setIsHandleAuthorized]);

    useEffect(() => {
        if (isHistoryOpen && directoryHandle) {
            syncLibrary(directoryHandle, { googleToken, auditCloudRegistry, loadCloudMetadata });
        }
    }, [isHistoryOpen, directoryHandle, googleToken, auditCloudRegistry, loadCloudMetadata, syncLibrary]);

    return (
        <div className="recorder-container">
            <header className="header-section" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ visibility: 'hidden' }}>Spacer</div>
                <div style={{ textAlign: 'center' }}>
                    <h1>Screen Studio</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Premium Recording Syncing with your PC</p>
                </div>
                <button className="btn btn-outline" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                    History {libraryFiles.length > 0 && `(${libraryFiles.length})`}
                </button>
            </header>

            <PreviewStage
                canvasRef={canvasRef}
                cameraStream={cameraStream}
                screenStream={screenStream}
                isRecording={isRecording}
                status={status}
                countdown={countdown}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
            />

            <ControlBar
                screenStream={screenStream}
                cameraStream={cameraStream}
                audioStream={audioStream}
                activeBg={activeBg}
                setActiveBg={setActiveBg}
                isRecording={isRecording}
                isBgPanelOpen={isBgPanelOpen}
                setIsBgPanelOpen={setIsBgPanelOpen}
                webcamShape={webcamShape}
                setWebcamShape={setWebcamShape}
                webcamScale={webcamScale}
                setWebcamScale={setWebcamScale}
                screenScale={screenScale}
                setScreenScale={setScreenScale}
                toggleScreen={() => {
                    const q = QUALITY_PRESETS[recordingQuality];
                    toggleScreen(q.width, q.height);
                }}
                toggleCamera={() => {
                    const q = QUALITY_PRESETS[recordingQuality];
                    toggleCamera(q.width, q.height);
                }}
                toggleMic={toggleMic}
                recordingQuality={recordingQuality}
                setRecordingQuality={setRecordingQuality}
                qualityPresets={QUALITY_PRESETS}
                recordingFormat={recordingFormat}
                setRecordingFormat={setRecordingFormat}
                startRecording={startRecording}
                pauseRecording={pauseRecording}
                resumeRecording={resumeRecording}
                stopRecording={stopRecording}
                isPaused={isPaused}
                handleStopAll={handleStopAll}
            />

            <div className="mode-info">
                <div className="status-dot" style={{ background: cameraStream ? 'var(--primary)' : 'var(--success)' }}></div>
                <span>Current Mode: {cameraStream ? 'Optimized Canvas' : 'Direct Hardware'}</span>
            </div>

            <footer style={{ marginTop: 'auto', paddingTop: '4rem', color: 'var(--text-muted)', fontSize: '0.75rem', width: '100%', maxWidth: '600px', textAlign: 'center', lineHeight: '1.5' }}>
                <p>© 2026 Gravity Labs. Built for performance and resilience.</p>
            </footer>

            <HistorySidebar
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
                cloudUser={cloudUser}
                handleGoogleAuth={handleGoogleAuth}
                handleLogout={handleLogout}
                directoryHandle={directoryHandle}
                isHandleAuthorized={isHandleAuthorized}
                connectFolder={connectFolder}
                resumeSync={resumeSync}
                libraryFiles={libraryFiles}
                thumbnailMap={thumbnailMap}
                getThumbnailUrl={getThumbnailUrl}
                highlightedFile={highlightedFile}
                playVideo={playVideo}
                editingFileName={editingFileName}
                newName={newName}
                setNewName={setNewName}
                handleRename={handleRename}
                setEditingFileName={setEditingFileName}
                uploadProgress={uploadProgress}
                cloudRegistry={cloudRegistry}
                uploadToDrive={uploadToDrive}
                startRename={startRename}
                deleteFile={deleteFile}
            />

            <VideoPlayerModal
                url={selectedVideoUrl}
                onClose={() => setSelectedVideoUrl(null)}
            />

            <Toast
                toast={toast}
                onClose={() => setToast(null)}
            />

            <SaveRecordingModal
                blob={pendingRecording?.blob}
                mimeType={pendingRecording?.mimeType}
                onSave={handleSaveRecording}
                onDiscard={() => setPendingRecording(null)}
            />
        </div>
    );
};

export default ScreenRecorder;
