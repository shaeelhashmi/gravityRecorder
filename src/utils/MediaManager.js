class MediaManager {
    async getScreenStream() {
        try {
            return await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    frameRate: { ideal: 30, max: 30 }
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
                    width: { max: width || 1280 },
                    height: { max: height || 720 },
                    frameRate: { max: 30 }
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
