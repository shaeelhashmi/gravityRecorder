import React from 'react';

export const VideoPlayerModal = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="btn-icon-bg modal-close" onClick={onClose}>✕</button>
                <video
                    src={url}
                    controls
                    autoPlay
                    style={{ width: '100%', display: 'block' }}
                />
            </div>
        </div>
    );
};
