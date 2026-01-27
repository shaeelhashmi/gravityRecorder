# Gravity Recorder 🎥

A premium, crash-resilient screen recorder built with React and Canvas.

## Features

- **Layered Recording**: Captures your screen with a stylized webcam bubble overlay.
- **Incremental Saving**: Video chunks are saved to IndexedDB every 3 seconds to prevent data loss.
- **Session Recovery**: If the browser or computer crashes, you can recover the partial recording on restart.
- **Customizable Layout**: Choose the position of your camera bubble.
- **Premium UI**: Modern dark-mode interface with smooth animations.

## How to Use

1. **Enable Streams**: Click "Enable Camera & Screen" and grant the necessary permissions.
2. **Setup**: Choose your preferred camera position.
3. **Record**: Click "Start Recording".
4. **Finish**: Click "Stop Recording" to download your video.
5. **Recovery**: If a session was interrupted, look for the yellow alert bar at the top on the next launch.

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Vanilla CSS
- **Media**: MediaDevices API, MediaRecorder API
- **Composition**: HTML5 Canvas
- **Storage**: IndexedDB (Incremental data persistence)
