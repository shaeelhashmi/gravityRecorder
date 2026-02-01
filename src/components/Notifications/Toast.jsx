import React from 'react';

export const Toast = ({ toast, onClose }) => {
    if (!toast) return null;

    return (
        <div className="toast-container">
            <div className={`toast ${toast.type}`}>
                <div className="toast-content">
                    <span className="toast-title">{toast.title}</span>
                    <span className="toast-message">{toast.message}</span>
                </div>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', opacity: 0.5 }}
                    onClick={onClose}
                >✕</button>
            </div>
        </div>
    );
};
