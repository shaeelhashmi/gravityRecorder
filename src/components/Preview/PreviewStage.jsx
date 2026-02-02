import React from 'react';

export const PreviewStage = ({
    canvasRef,
    cameraStream,
    screenStream,
    isRecording,
    status,
    countdown,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
}) => {
    return (
        <div className={`preview-wrapper ${isRecording ? 'is-recording' : ''}`}>
            {countdown !== null && (
                <div className="countdown-overlay">
                    <div className="countdown-number">{countdown}</div>
                </div>
            )}
            <canvas
                ref={canvasRef}
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
    );
};
