# Project: gravityRecorder
## Overview
A high-performance web-based screen recording application with Google Drive synchronization and a premium, responsive UI.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Premium aesthetics)
- **Media**: Web MediaStream API, MediaRecorder API
- **Storage**: IndexedDB (via StorageManager)
- **Cloud**: Google Drive API (Google Identity Services)

## Status (Completed / In Progress / Planned)
### Completed
- **Structural Refactor**: 100% complete. Logic extracted into custom hooks (`useStreams`, `useFileSystem`, `useGoogleSync`, `useRecording`).
- **UI Componentization**: 100% complete. Monolythic `ScreenRecorder.jsx` broken into specialized components (`PreviewStage`, `ControlBar`, `HistorySidebar`, etc.).
- **Cloud Sync**: Google Drive integration with profile management and shareable links.
- **Persistence**: Fixed token and profile logout persistence issue.

### Planned
- New Updates Phase (Awaiting USER details)

## Key Decisions
- **Hook-Based Logic**: Encapsulating complex Web API interactions in hooks to keep UI components "dumb" and easy to test.
- **Robust Fallbacks**: Implemented file-move fallbacks (copy-and-delete) for cross-browser reliability.
- **Premium UX**: Focus on smooth transitions, gradients, and lag-free UI interactions.

## Session Log
### 2026-01-29
- **Major Refactor**: Completed 7 phases of architectural overhaul.
- **Bug Fix**: Resolved technical debt in `StorageManager` regarding setting deletion.
- **Architecture**: Transitions the app from a prototype to a modular, production-ready codebase.
