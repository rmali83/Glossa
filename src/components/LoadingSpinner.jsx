import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = '' }) => {
    const sizeMap = {
        small: '24px',
        medium: '48px',
        large: '72px'
    };

    return (
        <div className="loading-spinner-container">
            <div 
                className="loading-spinner" 
                style={{ 
                    width: sizeMap[size], 
                    height: sizeMap[size] 
                }}
            >
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
