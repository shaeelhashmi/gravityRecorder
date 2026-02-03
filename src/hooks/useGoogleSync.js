import { useState, useCallback, useRef, useEffect } from 'react';
import { storageManager } from '../utils/StorageManager';
import { getFileSignature } from '../utils/FileUtils';

export const useGoogleSync = (showToast, directoryHandle) => {
    const [googleToken, setGoogleToken] = useState(null);
    const [cloudUser, setCloudUser] = useState({ isLoggedIn: false, profile: null });
    const [cloudRegistry, setCloudRegistry] = useState({}); // signature -> { driveId, shareLink }
    const [uploadProgress, setUploadProgress] = useState({}); // filename -> percentage
    const isAuditing = useRef(false);

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

    const handleLogout = useCallback(async () => {
        setGoogleToken(null);
        setCloudUser({ isLoggedIn: false, profile: null });
        await storageManager.removeSetting('cloud_user_token');
        await storageManager.removeSetting('cloud_user_profile');
        showToast('Cloud Disconnected', 'You have been signed out', 'info');
    }, [showToast]);

    const auditCloudRegistry = useCallback(async (token = googleToken, registryToAudit = cloudRegistry) => {
        if (!token || isAuditing.current) return;
        if (Object.keys(registryToAudit).length === 0) return;

        isAuditing.current = true;
        try {
            const query = encodeURIComponent("trashed = false");
            const url = `https://www.googleapis.com/drive/v3/files?pageSize=1000&q=${query}&fields=files(id)`;

            const resp = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resp.status === 401) {
                isAuditing.current = false;
                // Re-auth logic will be handled by the caller or a silent refresh if needed
                return;
            }

            if (!resp.ok) return;

            const { files } = await resp.json();
            const remoteIds = new Set((files || []).map(f => f.id));

            let cleaned = false;
            const newRegistry = { ...registryToAudit };
            let removedCount = 0;

            for (const [sig, data] of Object.entries(newRegistry)) {
                if (!remoteIds.has(data.driveId)) {
                    delete newRegistry[sig];
                    cleaned = true;
                    removedCount++;
                }
            }

            if (cleaned) {
                await saveCloudMetadata(newRegistry);
                showToast('Cloud Sync Updated', `Pruned ${removedCount} dead links.`, 'info');
            }
        } catch (err) {
            console.error('Audit failed:', err);
        } finally {
            isAuditing.current = false;
        }
    }, [googleToken, cloudRegistry, saveCloudMetadata, showToast]);

    const fetchUserProfile = useCallback(async (token) => {
        try {
            const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profile = await resp.json();
            const userData = { isLoggedIn: true, profile };
            setCloudUser(userData);

            await storageManager.setSetting('cloud_user_token', token);
            await storageManager.setSetting('cloud_user_profile', profile);

            auditCloudRegistry(token);
        } catch (err) {
            console.error('Profile fetch failed:', err);
        }
    }, [auditCloudRegistry]);

    const handleGoogleAuth = useCallback((onSuccess, forcePrompt = true, onFailure = () => { }, bypassCache = false) => {
        const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

        if (!clientID || !apiKey) {
            const missing = !clientID && !apiKey ? 'Client ID and API Key' : (!clientID ? 'Client ID' : 'API Key');
            showToast(
                'Cloud Sync Setup Required',
                `Google ${missing} is missing. Please check your .env file and setup documentation.`,
                'warning'
            );
            console.warn(`[Cloud Sync] Missing configuration: ${missing}`);
            return;
        }

        if (!forcePrompt && googleToken && !bypassCache) return onSuccess(googleToken);

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientID,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: (response) => {
                if (response.access_token) {
                    setGoogleToken(response.access_token);
                    fetchUserProfile(response.access_token);
                    onSuccess(response.access_token);
                } else if (response.error) {
                    onFailure(response.error);
                }
            },
        });

        client.requestAccessToken({ prompt: forcePrompt ? 'select_account' : '' });
    }, [googleToken, fetchUserProfile]);

    const uploadToDrive = async (fileHandle) => {
        handleGoogleAuth(async (token) => {
            const file = await fileHandle.getFile();
            const signature = getFileSignature(file);
            const fileName = file.name;

            setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

            try {
                const metadata = {
                    name: fileName,
                    mimeType: file.type || 'video/webm',
                };

                let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify(metadata),
                });

                if (response.status === 401) {
                    handleGoogleAuth(async (newToken) => {
                        uploadToDrive(fileHandle);
                    }, false, () => {
                        handleLogout();
                    }, true);
                    return;
                }

                if (!response.ok) throw new Error('Failed to initiate upload');
                const uploadUrl = response.headers.get('Location');

                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                });

                if (!uploadResponse.ok) throw new Error('Upload failed');
                const driveFile = await uploadResponse.json();

                await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
                });

                const fileInfoResp = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}?fields=webViewLink`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const { webViewLink } = await fileInfoResp.json();

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

    // Initialize Cloud State
    useEffect(() => {
        const loadCloud = async () => {
            const savedToken = await storageManager.getSetting('cloud_user_token');
            const savedProfile = await storageManager.getSetting('cloud_user_profile');
            if (savedToken && savedProfile) {
                setGoogleToken(savedToken);
                setCloudUser({ isLoggedIn: true, profile: savedProfile });
            }
        };
        loadCloud();
    }, []);

    return {
        googleToken, cloudUser, cloudRegistry, uploadProgress,
        handleGoogleAuth, handleLogout, uploadToDrive, auditCloudRegistry,
        loadCloudMetadata, saveCloudMetadata
    };
};
