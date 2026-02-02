class MediaManager {
    async getScreenStream(width, height) {
        try {
            return await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    width: width ? { ideal: width } : undefined,
                    height: height ? { ideal: height } : undefined
                },
                audio: true
            });
        } catch (err) {
            console.error("Error getting screen stream:", err);
            throw err;
        }
    }

    async getCameraStream(width, height) {
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: width || 1280 },
                    height: { ideal: height || 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (err) {
            console.error("Error getting camera stream:", err);
            throw err;
        }
    }

    async getAudioStream() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
        } catch (err) {
            console.error("Error getting audio stream:", err);
            throw err;
        }
    }

    stopStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
}

export const mediaManager = new MediaManager();
