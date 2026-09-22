import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import webglFluid from 'webgl-fluid';

const FluidBackground = forwardRef(({ className = '' }, ref) => {
  const canvasRef = useRef(null);
  const fluidSimRef = useRef(null);
  
  // Array of DOM rects that represent chat bubbles
  const obstaclesRef = useRef([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize fluid simulation
    // We tune the configuration to be subtle, viscous (like oil), and match the brand's aesthetic.
    fluidSimRef.current = webglFluid(canvasRef.current, {
      IMMEDIATE: true,
      TRIGGER: 'none',       // We will manually trigger splats, no mouse tracking by default
      SIM_RESOLUTION: 128,   // High enough for good physics, low enough for mobile performance
      DYE_RESOLUTION: 512,
      DENSITY_DISSIPATION: 0, // 0 = Never fades, stays permanently
      VELOCITY_DISSIPATION: 0, // 0 = Never stops moving, maintains kinetic energy
      PRESSURE_DISSIPATION: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 2,
      SPLAT_RADIUS: 0.35,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 10,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true,
      BLOOM: false
    });

    // Create a continuous subtle churn in the background so it is always slowly moving
    const churnInterval = setInterval(() => {
      if (fluidSimRef.current && typeof fluidSimRef.current.splat === 'function' && canvasRef.current) {
        // Very subtle random movement across the entire canvas width/height
        const x = Math.random() * canvasRef.current.clientWidth;
        const y = Math.random() * canvasRef.current.clientHeight;
        const dx = (Math.random() - 0.5) * 1000;
        const dy = (Math.random() - 0.5) * 1000;
        fluidSimRef.current.splat(x, y, dx, dy, { r: 0.1, g: 0.1, b: 0.2 });
      } else if (fluidSimRef.current && typeof fluidSimRef.current.multipleSplats === 'function') {
        fluidSimRef.current.multipleSplats(1);
      }
    }, 2000);

    return () => {
      clearInterval(churnInterval);
      if (typeof fluidSimRef.current?.destroy === 'function') {
        fluidSimRef.current.destroy();
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    splat: (normalizedX, normalizedY, dx, dy, color) => {
      try {
        if (fluidSimRef.current && typeof fluidSimRef.current.splat === 'function' && canvasRef.current) {
          const x = normalizedX * canvasRef.current.clientWidth;
          const y = normalizedY * canvasRef.current.clientHeight;
          fluidSimRef.current.splat(x, y, dx, dy, color);
        }
      } catch (e) {}
    },
    updateObstacles: (rects) => {
      obstaclesRef.current = rects;
      // Note: Passing true rigid obstacles to standard webgl-fluid requires custom GLSL.
      // We will emulate it by triggering counter-forces in the update loop later if needed,
      // or simply rely on the visual effect of the message bubbling up.
    }
  }));

  return (
    <canvas 
      ref={canvasRef} 
      className={`fluid-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.2
      }}
    />
  );
});

export default FluidBackground;
