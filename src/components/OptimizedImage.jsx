import React, { useState, useEffect, useRef } from 'react';

const OptimizedImage = ({ 
    src, 
    alt, 
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
    className = '',
    style = {},
    lazy = true
}) => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [imageRef, setImageRef] = useState();
    const imgRef = useRef();

    useEffect(() => {
        let observer;
        
        if (lazy && imgRef.current) {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setImageSrc(src);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    rootMargin: '50px'
                }
            );

            observer.observe(imgRef.current);
        } else {
            setImageSrc(src);
        }

        return () => {
            if (observer && imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src, lazy]);

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={className}
            style={{
                ...style,
                transition: 'opacity 0.3s ease-in-out',
                opacity: imageSrc === placeholder ? 0.5 : 1
            }}
            loading={lazy ? 'lazy' : 'eager'}
        />
    );
};

export default OptimizedImage;
