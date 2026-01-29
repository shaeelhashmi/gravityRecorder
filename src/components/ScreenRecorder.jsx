import React, { useRef, useState, useEffect, useCallback } from 'react';
import { mediaManager } from '../utils/MediaManager';
import { storageManager } from '../utils/StorageManager';
import { BACKGROUND_PRESETS } from '../constants/backgrounds';
import { getFileSignature } from '../utils/FileUtils';
import { useStreams } from '../hooks/useStreams';
import { useFileSystem } from '../hooks/useFileSystem';

const ScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('idle');

    // Refs for Media & Stage
    const canvasRef = useRef(null);
    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);

    const {
        screenStream, audioStream, cameraStream,
        toggleScreen, toggleMic, toggleCamera, stopAll: stopStreams
    } = useStreams(screenVideoRef, cameraVideoRef, setStatus);
    const [webcamShape, setWebcamShape] = useState('circle'); // circle, rounded-rect, square
    const [webcamScale, setWebcamScale] = useState(0.40); // Default to Medium (0.40)
    const [activeBg, setActiveBg] = useState('none');
    const [screenScale, setScreenScale] = useState(1.0);
    const [isBgPanelOpen, setIsBgPanelOpen] = useState(false);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [highlightedFile, setHighlightedFile] = useState(null);

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
        playVideo, startRename, handleRename,
        generateThumbnail, getThumbnailUrl
    } = useFileSystem(showToast, setHighlightedFile);

    // Google Drive Sync State
    const [googleToken, setGoogleToken] = useState(null);
    const [cloudUser, setCloudUser] = useState({ isLoggedIn: false, profile: null });
    const [cloudRegistry, setCloudRegistry] = useState({}); // signature -> { driveId, shareLink }
    const [uploadProgress, setUploadProgress] = useState({}); // filename -> percentage

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
            handleStopAll();
        };
    }, []);

    const handleStopAll = () => {
        if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        stopStreams();
    };


    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        const draw = () => {
            if (!screenStream && !cameraStream && activeBg === 'none') {
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

            // 2. Draw Screen (Centered and Scaled)
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
            if (cameraStream || screenStream || activeBg !== 'none') {
                drawTimerRef.current = setTimeout(draw, 1000 / 30);
            }
        };

        if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        draw();
    };

    // Trigger canvas loop when sources change
    useEffect(() => {
        if (cameraStream || screenStream || activeBg !== 'none') {
            drawCanvas();
        } else {
            if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
        }
    }, [cameraStream, screenStream, webcamShape, webcamScale, activeBg, screenScale]);

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
                            // Fallback to manual download if direct save fails
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
    };

    const triggerDownload = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
    };


    // --- Google Drive Sync & Metadata Logic ---

    const loadCloudMetadata = useCallback(async (dirHandle) => {
        try {
            const assetsHandle = await dirHandle.getDirectoryHandle('.recorder_assets', { create: true });
            const metaHandle = await assetsHandle.getFileHandle('metadata.json', { create: true });
            const file = await metaHandle.getFile();
            const text = await file.text();
            if (text) {
                const data = JSON.parse(text);
                setCloudRegistry(data);
                return data;
            }
        } catch (err) {
            console.warn('Could not load metadata:', err);
        }
        return {};
    }, []);

    const saveCloudMetadata = useCallback(async (newMeta) => {
        if (!directoryHandle) return;
        try {
            const assetsHandle = await directoryHandle.getDirectoryHandle('.recorder_assets', { create: true });
            const metaHandle = await assetsHandle.getFileHandle('metadata.json', { create: true });
            const writable = await metaHandle.createWritable();
            await writable.write(JSON.stringify(newMeta));
            await writable.close();
            setCloudRegistry(newMeta);
        } catch (err) {
            console.error('Metadata save failed:', err);
        }
    }, [directoryHandle]);

    const isAuditing = useRef(false);

    const handleGoogleAuth = useCallback((onSuccess, forcePrompt = true, onFailure = () => { }, bypassCache = false) => {
        // Only return cached token if we are NOT forcing a prompt or refresh, and not bypassing cache
        if (!forcePrompt && googleToken && !bypassCache) return onSuccess(googleToken);

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: (response) => {
                if (response.access_token) {
                    setGoogleToken(response.access_token);
                    fetchUserProfile(response.access_token);
                    onSuccess(response.access_token);
                } else if (response.error) {
                    console.error('Auth callback error:', response.error);
                    onFailure(response.error);
                }
            },
        });

        // Request token. If prompt: '' it tries to refresh silently.
        client.requestAccessToken({ prompt: forcePrompt ? 'select_account' : '' });
    }, [googleToken]); // Removed fetchUserProfile dependency

    const fetchUserProfile = useCallback(async (token) => {
        try {
            const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profile = await resp.json();
            const userData = { isLoggedIn: true, profile };
            setCloudUser(userData);

            // Persist to storage
            await storageManager.setSetting('cloud_user_token', token);
            await storageManager.setSetting('cloud_user_profile', profile);

            // Trigger audit after login
            auditCloudRegistry(token);
        } catch (err) {
            console.error('Profile fetch failed:', err);
        }
    }, [googleToken]); // Removed auditCloudRegistry dependency, added googleToken for stability

    const handleLogout = useCallback(async () => {
        setGoogleToken(null);
        setCloudUser({ isLoggedIn: false, profile: null });
        await storageManager.removeSetting('cloud_user_token');
        await storageManager.removeSetting('cloud_user_profile');
        showToast('Cloud Disconnected', 'You have been signed out', 'info');
    }, [showToast]);

    const auditCloudRegistry = useCallback(async (token = googleToken, registryToAudit = cloudRegistry) => {
        if (!token || isAuditing.current) {
            console.log('☁️ [Audit Skip] No Google Token found or already auditing.');
            return;
        }
        if (Object.keys(registryToAudit).length === 0) {
            console.log('☁️ [Audit Skip] Local registry is empty.');
            return;
        }

        isAuditing.current = true;

        console.log('☁️ [Audit] Initiating Batch Call to Google Drive...', {
            apiUrl: 'https://www.googleapis.com/drive/v3/files',
            localItemsCount: Object.keys(registryToAudit).length
        });

        try {
            const query = encodeURIComponent("trashed = false");
            const url = `https://www.googleapis.com/drive/v3/files?pageSize=1000&q=${query}&fields=files(id)`;

            console.log('☁️ [Audit] Fetching:', url);

            const resp = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resp.status === 401) {
                console.warn('⚠️ [Audit] Token expired (401). Attempting silent re-auth...');
                isAuditing.current = false; // Reset to allow the retry call
                handleGoogleAuth((newToken) => {
                    console.log('🔄 [Audit] Token refreshed! Retrying...');
                    auditCloudRegistry(newToken, registryToAudit);
                }, false, (err) => {
                    console.error('❌ [Audit] Silent re-auth failed. Logging out.', err);
                    handleLogout();
                }, true); // bypassCache = true
                return;
            }

            if (!resp.ok) {
                const errText = await resp.text();
                console.error('❌ [Audit] Google API error:', resp.status, errText);
                return;
            }

            const { files } = await resp.json();
            const remoteIds = new Set((files || []).map(f => f.id));

            console.log('☁️ [Audit] Results received from Google Drive:', {
                foundOnDrive: remoteIds.size,
                remoteFileIds: Array.from(remoteIds)
            });

            let cleaned = false;
            const newRegistry = { ...registryToAudit };
            let removedCount = 0;

            for (const [sig, data] of Object.entries(newRegistry)) {
                if (!remoteIds.has(data.driveId)) {
                    console.log('🗑️ [Audit] Ghost link found! Pruning ID:', data.driveId);
                    delete newRegistry[sig];
                    cleaned = true;
                    removedCount++;
                }
            }

            if (cleaned) {
                await saveCloudMetadata(newRegistry);
                showToast('Cloud Sync Updated', `Pruned ${removedCount} dead links.`, 'info');
                console.log(`✅ [Audit] Pruning complete. ${removedCount} stale entries removed.`);
            } else {
                console.log('✅ [Audit] Success. Everything in local registry matches Drive.');
            }
        } catch (err) {
            console.error('❌ [Audit] Unexpected Failure:', err);
        } finally {
            isAuditing.current = false;
        }
    }, [googleToken, cloudRegistry, handleGoogleAuth, handleLogout, saveCloudMetadata, showToast]);

    const uploadToDrive = async (fileHandle) => {
        handleGoogleAuth(async (token) => {
            const file = await fileHandle.getFile();
            const signature = getFileSignature(file);
            const fileName = file.name;

            setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

            try {
                // 1. Create File Metadata
                const metadata = {
                    name: fileName,
                    mimeType: file.type || 'video/webm',
                };

                // 2. Initiate Resumable Upload
                let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify(metadata),
                });

                if (response.status === 401) {
                    console.warn('⚠️ [Upload] Token expired. Silent refreshing...');
                    handleGoogleAuth(async (newToken) => {
                        console.log('🔄 [Upload] Refreshed! Retrying...');
                        uploadToDrive(fileHandle); // Recursive retry with NEW token
                    }, false, () => {
                        console.error('❌ [Upload] Refresh failed. Logging out.');
                        handleLogout();
                    }, true); // bypassCache = true
                    return;
                }

                if (!response.ok) throw new Error('Failed to initiate upload');
                const uploadUrl = response.headers.get('Location');

                // 3. Upload Content
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                });

                if (!uploadResponse.ok) throw new Error('Upload failed');
                const driveFile = await uploadResponse.json();

                // 4. Set Permissions (Make Public)
                await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        role: 'reader',
                        type: 'anyone',
                    }),
                });

                // 5. Get Share Link
                const fileInfoResp = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}?fields=webViewLink`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const { webViewLink } = await fileInfoResp.json();

                // 6. Update Registry
                const newMeta = { ...cloudRegistry, [signature]: { driveId: driveFile.id, shareLink: webViewLink } };
                await saveCloudMetadata(newMeta);

                showToast('Cloud Sync Success', `${fileName} is ready to share!`, 'success');
            } catch (err) {
                console.error('Upload failed:', err);
                showToast('Cloud Sync Failed', 'Check your connection', 'error');
            } finally {
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[fileName];
                    return next;
                });
            }
        }, false);
    };

    // Load state from storage on mount
    useEffect(() => {
        const loadSavedState = async () => {
            // 1. Workspace Handle
            const savedHandle = await storageManager.getSetting('workspace_handle');
            if (savedHandle) {
                setDirectoryHandle(savedHandle);
                const state = await savedHandle.queryPermission({ mode: 'readwrite' });
                setIsHandleAuthorized(state === 'granted');
            }

            // 2. Cloud User
            const savedToken = await storageManager.getSetting('cloud_user_token');
            const savedProfile = await storageManager.getSetting('cloud_user_profile');
            if (savedToken && savedProfile) {
                setGoogleToken(savedToken);
                setCloudUser({ isLoggedIn: true, profile: savedProfile });
            }
        };
        loadSavedState();
    }, []);



    // Sync on mount if handle exists (not possible with directory picker as it requires interaction)
    // So we just sync whenever history is opened
    useEffect(() => {
        if (isHistoryOpen && directoryHandle) {
            syncLibrary(directoryHandle, {
                googleToken,
                auditCloudRegistry,
                loadCloudMetadata
            });
        }
    }, [isHistoryOpen, directoryHandle]); // Reduced dependencies to break loop

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
        setStatus('ready');
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
                                            {p.id === 'none' && <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>None</span>}
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

                <div className="control-bar">
                    <div className="source-toggles" style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass)', padding: '0.4rem', borderRadius: '100px', border: '1px solid var(--glass-border)' }}>
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
                        <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 0.2rem' }}></div>
                        <button className={`btn-pill ${activeBg !== 'none' ? 'active' : ''}`}
                            onClick={() => {
                                setIsBgPanelOpen(!isBgPanelOpen);
                            }} disabled={isRecording}>
                            {activeBg !== 'none' ? '🎨 Styled' : '🎨 BG'}
                        </button>
                    </div>

                    <div className="main-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {(screenStream || cameraStream) && (
                            <button className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                                onClick={isRecording ? stopRecording : startRecording}>
                                {isRecording ? 'Stop' : 'Start Recording'}
                            </button>
                        )}
                        <button className="btn-icon-bg" onClick={handleStopAll} title="Reset">✕</button>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Library</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Files synced to disk</span>
                    </div>
                    <button className="btn-icon-bg" onClick={() => setIsHistoryOpen(false)}>✕</button>
                </div>

                {/* Cloud Hub Section */}
                <div className="cloud-hub glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                    {!cloudUser.isLoggedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>☁️</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cloud Sync</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sign in to share links</span>
                                </div>
                            </div>
                            <button className="btn-small active" onClick={() => handleGoogleAuth(() => { })}>Connect</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {cloudUser.profile?.picture ? (
                                    <img src={cloudUser.profile.picture} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} alt="" />
                                ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                        {cloudUser.profile?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {cloudUser.profile?.name || 'User'}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        ● <span style={{ color: 'var(--text-muted)' }}>Connected</span>
                                    </span>
                                </div>
                            </div>
                            <button className="btn-small" onClick={handleLogout} style={{ opacity: 0.6, fontSize: '0.6rem' }}>Sign Out</button>
                        </div>
                    )}
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
                            libraryFiles.map(file => {
                                // Effect to load thumbnail if not present
                                if (!thumbnailMap[file.name]) {
                                    getThumbnailUrl(file.name, file.handle, directoryHandle);
                                }

                                return (
                                    <div key={file.name}
                                        className={`video-card ${highlightedFile === file.name ? 'highlight-success' : ''}`}
                                        onClick={() => playVideo(file.handle)}>
                                        <div className="video-thumb">
                                            {thumbnailMap[file.name] ? (
                                                <img src={thumbnailMap[file.name]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            ) : (
                                                <span style={{ fontSize: '1.5rem' }}>▶</span>
                                            )}
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
                                                        <div className="video-actions">
                                                            {uploadProgress[file.name] !== undefined ? (
                                                                <span className="upload-loader" title="Uploading...">⏳</span>
                                                            ) : cloudRegistry[file.signature] ? (
                                                                <button
                                                                    className="btn-cloud active"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(cloudRegistry[file.signature].shareLink, '_blank');
                                                                    }}
                                                                    title="Open Share Link"
                                                                >🔗</button>
                                                            ) : (
                                                                <button
                                                                    className="btn-cloud"
                                                                    onClick={(e) => { e.stopPropagation(); uploadToDrive(file.handle); }}
                                                                    title="Upload to Google Drive"
                                                                >☁️</button>
                                                            )}
                                                            <button className="btn-rename" onClick={e => startRename(e, file)} title="Rename">✎</button>
                                                        </div>
                                                    </div>
                                                    <span className="video-meta">{file.date} • {file.size}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
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

            {/* Toast Notifications */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <div className="toast-content">
                            <span className="toast-title">{toast.title}</span>
                            <span className="toast-message">{toast.message}</span>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setToast(null)}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorder;
