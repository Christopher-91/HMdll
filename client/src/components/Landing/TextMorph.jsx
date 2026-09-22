import React, { useEffect, useRef } from 'react';
import './TextMorph.css';

const TEXTS = [
    "Your study abroad journey",
    "Starts Here"
];

export default function TextMorph() {
    const text1Ref = useRef(null);
    const text2Ref = useRef(null);

    useEffect(() => {
        const text1 = text1Ref.current;
        const text2 = text2Ref.current;
        if (!text1 || !text2) return;

        const morphTime = 1;
        const cooldownTime = 1.5; // Longer than CodePen (0.25) to give time to read

        let textIndex = TEXTS.length - 1;
        let time = new Date();
        let morph = 0;
        let cooldown = cooldownTime;

        text1.textContent = TEXTS[textIndex % TEXTS.length];
        text2.textContent = TEXTS[(textIndex + 1) % TEXTS.length];

        function setMorph(fraction) {
            text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
            text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
            
            fraction = 1 - fraction;
            text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
            text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
            
            text1.textContent = TEXTS[textIndex % TEXTS.length];
            text2.textContent = TEXTS[(textIndex + 1) % TEXTS.length];
        }

        function doMorph() {
            morph -= cooldown;
            cooldown = 0;
            
            let fraction = morph / morphTime;
            
            if (fraction > 1) {
                cooldown = cooldownTime;
                fraction = 1;
            }
            
            setMorph(fraction);
        }

        function doCooldown() {
            morph = 0;
            text2.style.filter = "";
            text2.style.opacity = "100%";
            text1.style.filter = "";
            text1.style.opacity = "0%";
        }

        let animationFrameId;

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            
            let newTime = new Date();
            let shouldIncrementIndex = cooldown > 0;
            let dt = (newTime - time) / 1000;
            time = newTime;
            
            cooldown -= dt;
            
            if (cooldown <= 0) {
                if (shouldIncrementIndex) {
                    textIndex++;
                }
                doMorph();
            } else {
                doCooldown();
            }
        }

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div id="text-morph-container">
                <span id="text1" ref={text1Ref}></span>
                <span id="text2" ref={text2Ref}></span>
            </div>

            <svg id="text-morph-filters" style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="threshold">
                        <feColorMatrix in="SourceGraphic"
                                type="matrix"
                                values="1 0 0 0 0
                                                0 1 0 0 0
                                                0 0 1 0 0
                                                0 0 0 255 -140" />
                    </filter>
                </defs>
            </svg>
        </>
    );
}
