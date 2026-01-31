import React, { useState, useEffect } from 'react';
import './TypewriterText.css';

const TypewriterText = ({ phrases, speed = 100, deleteSpeed = 50, delay = 2000, className = "" }) => {
    const [displayText, setDisplayText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(speed);

    useEffect(() => {
        const handleTyping = () => {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                setCurrentSpeed(deleteSpeed);
            } else {
                setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                setCurrentSpeed(speed);
            }

            if (!isDeleting && displayText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
        };

        const timer = setTimeout(handleTyping, currentSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, phraseIndex, currentSpeed, phrases, speed, deleteSpeed, delay]);

    return (
        <span className={`typewriter-wrapper ${className}`}>
            {displayText}<span className="typewriter-cursor">|</span>
        </span>
    );
};

export default TypewriterText;
