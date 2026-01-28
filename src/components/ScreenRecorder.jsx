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
    const [webcamShape, setWebcamShape] = useState('circle'); // circle, rounded-rect, square
    const [webcamScale, setWebcamScale] = useState(0.40); // Default to Medium (0.40)

    // Video Library & Sync State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [directoryHandle, setDirectoryHandle] = useState(null);
    const [isHandleAuthorized, setIsHandleAuthorized] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState([]);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
    const [editingFileName, setEditingFileName] = useState(null); // name of file being renamed
    const [newName, setNewName] = useState('');

    // Position State (using Ref for 0-lag updates)
    const webcamPos = useRef({ x: 20, y: 410 }); // Default Bottom-Left (approx)
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

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
        const ctx = canvas.getContext('2d', { alpha: false });

        const draw = () => {
            if (!screenStream && !cameraStream) {
                if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
                return;
            }

            // Fixed internal resolution for stability
            canvas.width = 1280;
            canvas.height = 720;

            const bubbleSize = canvas.height * webcamScale;

            // Constrain position to canvas bounds
            webcamPos.current.x = Math.max(0, Math.min(1280 - bubbleSize, webcamPos.current.x));
            webcamPos.current.y = Math.max(0, Math.min(720 - bubbleSize, webcamPos.current.y));

            const { x, y } = webcamPos.current;

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
                const bubbleSize = canvas.height * webcamScale;
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

                // Draw border path
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
    }, [cameraStream, screenStream, webcamShape, webcamScale]);

    // Drag and Drop Logic (Lag-Free)
    const getCanvasMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = 1280 / rect.width;
        const scaleY = 720 / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e) => {
        const pos = getCanvasMousePos(e);
        const bubbleSize = 720 * webcamScale;
        const { x, y } = webcamPos.current;

        // Check if click is inside bubble
        if (pos.x >= x && pos.x <= x + bubbleSize && pos.y >= y && pos.y <= y + bubbleSize) {
            isDragging.current = true;
            dragOffset.current = {
                x: pos.x - x,
                y: pos.y - y
            };
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const pos = getCanvasMousePos(e);
        webcamPos.current = {
            x: pos.x - dragOffset.current.x,
            y: pos.y - dragOffset.current.y
        };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

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
                    const fileName = `recording-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;

                    // If folder is connected, save directly
                    if (directoryHandle) {
                        try {
                            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(blob);
                            await writable.close();
                            syncLibrary(directoryHandle); // Refresh
                        } catch (err) {
                            console.error('Direct save failed:', err);
                            // Fallback to manual download if direct save fails
                            triggerDownload(blob, fileName);
                        }
                    } else {
                        triggerDownload(blob, fileName);
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
    };

    const triggerDownload = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    };

    // --- Video Library Logic ---

    // Load handle from storage on mount
    useEffect(() => {
        const loadHandle = async () => {
            const savedHandle = await storageManager.getSetting('workspace_handle');
            if (savedHandle) {
                setDirectoryHandle(savedHandle);
                // Check if we still have permission (browsers usually reset this on refresh)
                const state = await savedHandle.queryPermission({ mode: 'readwrite' });
                setIsHandleAuthorized(state === 'granted');
            }
        };
        loadHandle();
    }, []);

    const connectFolder = async () => {
        try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            setDirectoryHandle(handle);
            setIsHandleAuthorized(true);
            await storageManager.setSetting('workspace_handle', handle);
            await syncLibrary(handle);
        } catch (err) {
            console.warn('Folder connection skipped:', err);
        }
    };

    const resumeSync = async () => {
        if (!directoryHandle) return;
        try {
            const state = await directoryHandle.requestPermission({ mode: 'readwrite' });
            if (state === 'granted') {
                setIsHandleAuthorized(true);
                await syncLibrary(directoryHandle);
            }
        } catch (err) {
            console.error('Permission request failed:', err);
        }
    };

    const syncLibrary = async (handle = directoryHandle) => {
        if (!handle) return;

        // Ensure we have permission
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            setIsHandleAuthorized(false);
            return;
        }

        const files = [];
        try {
            for await (const entry of handle.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.webm') || entry.name.endsWith('.mp4'))) {
                    const file = await entry.getFile();
                    files.push({
                        name: entry.name,
                        handle: entry,
                        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                        date: new Date(file.lastModified).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
                        timestamp: file.lastModified
                    });
                }
            }
            // Sort by latest timestamp (newest first)
            setLibraryFiles(files.sort((a, b) => b.timestamp - a.timestamp));
            setIsHandleAuthorized(true);
        } catch (err) {
            console.error('History sync failed:', err);
            if (err.name === 'NotAllowedError') setIsHandleAuthorized(false);
        }
    };

    const playVideo = async (fileEntry) => {
        if (editingFileName) return; // Don't play while renaming
        try {
            const file = await fileEntry.getFile();
            const url = URL.createObjectURL(file);
            setSelectedVideoUrl(url);
        } catch (err) {
            alert('File not found. It may have been moved or deleted.');
            syncLibrary(); // Refresh to clean up
        }
    };

    const startRename = (e, file) => {
        e.stopPropagation();
        setEditingFileName(file.name);
        setNewName(file.name);
    };

    const handleRename = async (e, fileHandle) => {
        e.stopPropagation();
        if (!newName || newName === fileHandle.name) {
            setEditingFileName(null);
            return;
        }

        try {
            // Ensure extension is preserved or added
            let finalName = newName;
            const ext = fileHandle.name.split('.').pop();
            if (!finalName.endsWith(`.${ext}`)) {
                finalName += `.${ext}`;
            }

            await fileHandle.move(finalName);
            setEditingFileName(null);
            syncLibrary();
        } catch (err) {
            console.error('Rename failed:', err);
            alert('Rename failed. Check permissions or if file exists.');
        }
    };

    // Sync on mount if handle exists (not possible with directory picker as it requires interaction)
    // So we just sync whenever history is opened
    useEffect(() => {
        if (isHistoryOpen && directoryHandle) {
            syncLibrary();
        }
    }, [isHistoryOpen]);

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
            <header className="header-section" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ visibility: 'hidden' }}>Dummy</div> {/* Spacing spacer */}
                <div style={{ textAlign: 'center' }}>
                    <h1>Screen Studio</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Premium Recording Syncing with your PC</p>
                </div>
                <button className="btn btn-outline" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                    History {libraryFiles.length > 0 && `(${libraryFiles.length})`}
                </button>
            </header>

            <div className={`preview-wrapper ${isRecording ? 'is-recording' : ''}`}>
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="preview-canvas"
                    style={{
                        display: (cameraStream || screenStream) ? 'block' : 'none',
                        cursor: isRecording ? 'default' : 'move'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                {!cameraStream && !screenStream && (
                    <div className="preview-placeholder">Sources Inactive — Enable Screen or Camera to start</div>
                )}

                {status === 'recording' && (
                    <div className="status-badge status-recording">
                        <span className="status-dot"></span>
                        REC {cameraStream ? 'CANVAS' : 'DIRECT'}
                    </div>
                )}
            </div>

            <div className="control-bar-container">
                {cameraStream && !isRecording && (
                    <div className="camera-dropdown glass-card">
                        <div className="setting-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <span className="setting-label">Frame</span>
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
                                <span className="setting-label">Size</span>
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

                <div className="control-bar">
                    <div className="source-toggles" style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass)', padding: '0.4rem', borderRadius: '100px', border: '1px solid var(--glass-border)' }}>
                        <button className={`btn-pill ${screenStream ? 'active' : ''}`}
                            onClick={toggleScreen} disabled={isRecording}>
                            {screenStream ? '● Screen' : 'Screen'}
                        </button>
                        <button className={`btn-pill ${cameraStream ? 'active' : ''}`}
                            onClick={toggleCamera} disabled={isRecording}>
                            {cameraStream ? '● Camera' : 'Camera'}
                        </button>
                        <button className={`btn-pill ${audioStream ? 'active' : ''}`}
                            onClick={toggleMic} disabled={isRecording}>
                            {audioStream ? '● Mic' : 'Mic'}
                        </button>
                    </div>

                    <div className="main-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {(screenStream || cameraStream) && (
                            <button className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                                onClick={isRecording ? stopRecording : startRecording}>
                                {isRecording ? 'Stop' : 'Start Recording'}
                            </button>
                        )}
                        <button className="btn-icon-bg" onClick={stopAll} title="Reset">✕</button>
                    </div>
                </div>
            </div>


            <div className="mode-info">
                <div className="status-dot" style={{ background: cameraStream ? 'var(--primary)' : 'var(--success)' }}></div>
                <span>Current Mode: {cameraStream ? 'Optimized Canvas' : 'Direct Hardware'}</span>
            </div>

            <footer style={{ marginTop: 'auto', paddingTop: '4rem', color: 'var(--text-muted)', fontSize: '0.75rem', width: '100%', maxWidth: '600px', textAlign: 'center', lineHeight: '1.5' }}>
                <p>© 2026 Gravity Labs. Built for performance and resilience.</p>
            </footer>

            {/* History Sidebar */}
            <div className={`sidebar ${isHistoryOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3 style={{ fontSize: '1.2rem' }}>Recent Recordings</h3>
                    <button className="btn-icon-bg" onClick={() => setIsHistoryOpen(false)}>✕</button>
                </div>

                {!directoryHandle ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📁</span>
                        <p>Connect a folder to track your recordings on this PC.</p>
                        <button className="btn btn-primary" onClick={connectFolder} style={{ marginTop: '1.5rem', width: '100%' }}>
                            Select Workspace Folder
                        </button>
                    </div>
                ) : !isHandleAuthorized ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🔒</span>
                        <p>Connection lost after refresh.</p>
                        <button className="btn btn-primary" onClick={resumeSync} style={{ marginTop: '1.5rem', width: '100%' }}>
                            Resume Sync with {directoryHandle.name}
                        </button>
                        <button onClick={connectFolder} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', marginTop: '1rem' }}>Pick another folder</button>
                    </div>
                ) : (
                    <div className="sidebar-content">
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Connected to: {directoryHandle.name}</span>
                            <button onClick={connectFolder} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem' }}>Change</button>
                        </div>

                        {libraryFiles.length === 0 ? (
                            <div className="empty-state">No recordings found in this folder.</div>
                        ) : (
                            libraryFiles.map(file => (
                                <div key={file.name} className="video-card" onClick={() => playVideo(file.handle)}>
                                    <div className="video-thumb">
                                        <span style={{ fontSize: '1.5rem' }}>▶</span>
                                    </div>
                                    <div className="video-info">
                                        {editingFileName === file.name ? (
                                            <div onClick={e => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    className="rename-input"
                                                    value={newName}
                                                    onChange={e => setNewName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleRename(e, file.handle)}
                                                />
                                                <div className="rename-actions">
                                                    <button className="btn-small active" onClick={e => handleRename(e, file.handle)}>Save</button>
                                                    <button className="btn-small" onClick={() => setEditingFileName(null)}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="video-title-row">
                                                    <span className="video-title">{file.name}</span>
                                                    <button className="btn-rename" onClick={e => startRename(e, file)} title="Rename">✎</button>
                                                </div>
                                                <span className="video-meta">{file.date} • {file.size}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            {selectedVideoUrl && (
                <div className="modal-overlay" onClick={() => setSelectedVideoUrl(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon-bg modal-close" onClick={() => setSelectedVideoUrl(null)}>✕</button>
                        <video
                            src={selectedVideoUrl}
                            controls
                            autoPlay
                            style={{ width: '100%', display: 'block' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorder;
