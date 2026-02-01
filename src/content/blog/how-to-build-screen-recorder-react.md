---
title: "How to Build a High-Performance Screen Recorder with React and Canvas"
date: "2026-02-01"
author: "Uzair Kath"
excerpt: "A deep dive into the technical architecture of Gravity Recorder: Canvas compositing, MediaStreams, and Local-First storage."
image: "/tech-deep-dive-featured.png"
keywords: "react screen recorder, canvas api tutorial, mediarecorder api react, building a screen recorder, web media streams"
---

Building a screen recorder in the browser sounds simple at first: just call `getDisplayMedia()` and feed it into a `MediaRecorder`. 

But if you want to create a **Screen Studio**—with webcam overlays, custom backgrounds, and zero-latency UI—the complexity ramps up quickly.

In this deep dive, we’ll look at the technical architecture behind **Gravity Recorder** and how we use React and the Canvas API to create a premium recording experience.

## The Challenge: Compositing in Real-Time

A standard `MediaRecorder` takes a single stream. To have a screen *and* a webcam, you usually have to choose one or use CSS to overlay them. However, if you want to record the *combination* of them as a single video file, you need to composite them.

### Step 1: Capturing the Streams
We start by capturing the system audio, screen, and mic/webcam separately:

```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
```

### Step 2: The Canvas Engine
This is where the magic happens. We don't record the streams directly. Instead, we create a high-resolution `<canvas>` element (e.g., 1920x1080) and run a render loop at 60fps.

In each frame, we draw:
1. The **Background** (gradient or image).
2. The **Screen Capture** (scaled and padded).
3. The **Webcam** (masked as a circle or rounded rect).

```javascript
function renderFrame() {
  ctx.drawImage(bgImage, 0, 0, 1920, 1080);
  ctx.drawImage(screenVideo, screenX, screenY, screenW, screenH);
  
  // Custom camera mask logic
  ctx.save();
  ctx.beginPath();
  ctx.arc(camX, camY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(cameraVideo, camX - r, camY - r, r*2, r*2);
  ctx.restore();
  
  requestAnimationFrame(renderFrame);
}
```

## Optimizing for Performance

Running a 60fps canvas render loop while simultaneously encoding video is CPU intensive. To keep Gravity "Local-First" and lag-free, we implemented several optimizations:

### 1. Unified Stream Capture
We use `canvas.captureStream(60)` to get a single video track of the composited studio. This track is then combined with the processed audio tracks before being sent to the `MediaRecorder`.

### 2. IndexedDB Chunking
To prevent data loss on browser crashes, we don't store the final video in memory. We listen for `ondataavailable` events and pipe the small video chunks directly into **IndexedDB**. This ensures that even if you record for an hour, your RAM usage remains stable.

### 3. Offscreen Canvas (Experimental)
By moving the render logic to an `OffscreenCanvas` inside a Web Worker, we can keep the main UI thread free for user interactions like dragging the webcam or changing themes.

## Lessons Learned

Building Gravity Recorder taught us that the web platform is incredibly capable if you’re willing to go beyond the default APIs. By treating the browser as a graphics engine (Canvas) rather than just a document viewer, we can build tools that rival native desktop applications.

**[Check out the Source Code on GitHub →](https://github.com/uzairkath/gravityRecorder)**
