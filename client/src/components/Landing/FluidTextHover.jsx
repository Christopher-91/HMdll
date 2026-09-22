import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Texture, Mesh, Vec2, Vec4, Geometry, Flowmap } from 'ogl';
import './FluidTextHover.css';

const vertex = `
    attribute vec2 uv;
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`;

const fragment = `
    precision highp float;
    precision highp int;
    uniform sampler2D tWater;
    uniform sampler2D tFlow;
    uniform float uTime;
    varying vec2 vUv;
    uniform vec4 res;
    uniform vec2 img;

    void main() {
        // R and G values are velocity in the x and y direction
        // B value is the velocity length
        vec3 flow = texture2D(tFlow, vUv).rgb;

        vec2 uv = .5 * gl_FragCoord.xy / res.xy ;

        vec2 myUV = (uv - vec2(0.5))*res.zw + vec2(0.5);
        myUV -= flow.xy * (0.15 * 1.2);

        vec2 myUV2 = (uv - vec2(0.5))*res.zw + vec2(0.5);
        myUV2 -= flow.xy * (0.125 * 1.2);

        vec2 myUV3 = (uv - vec2(0.5))*res.zw + vec2(0.5);
        myUV3 -= flow.xy * (0.10 * 1.4);

        vec3 tex = texture2D(tWater, myUV).rgb;
        vec3 tex2 = texture2D(tWater, myUV2).rgb;
        vec3 tex3 = texture2D(tWater, myUV3).rgb;

        // Boost brightness and vibrancy by multiplying the color
        vec3 finalColor = vec3(tex.r, tex2.g, tex3.b) * 1.8;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export default function FluidTextHover({ text }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const _size = [2048, 1638];
        const renderer = new Renderer({ dpr: 2 });
        const gl = renderer.gl;
        containerRef.current.appendChild(gl.canvas);

        let aspect = 1;
        const mouse = new Vec2(-1);
        const velocity = new Vec2();
        
        let lastTime;
        const lastMouse = new Vec2();
        let animationId;

        const flowmap = new Flowmap(gl, {
            falloff: 0.3,
            dissipation: 0.92,
            alpha: 0.5
        });

        const geometry = new Geometry(gl, {
            position: {
                size: 2,
                data: new Float32Array([-1, -1, 3, -1, -1, 3])
            },
            uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
        });

        const texture = new Texture(gl, {
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR
        });

        const img = new Image();
        img.onload = () => (texture.image = img);
        img.crossOrigin = "Anonymous";
        img.src = "/images/hero-bg-5.jpg";

        let a1, a2;
        const imageAspect = _size[1] / _size[0];
        if (window.innerHeight / window.innerWidth < imageAspect) {
            a1 = 1;
            a2 = window.innerHeight / window.innerWidth / imageAspect;
        } else {
            a1 = window.innerWidth / window.innerHeight * imageAspect;
            a2 = 1;
        }

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                tWater: { value: texture },
                res: {
                    value: new Vec4(window.innerWidth, window.innerHeight, a1, a2)
                },
                img: { value: new Vec2(_size[1], _size[0]) },
                tFlow: flowmap.uniform
            }
        });

        const mesh = new Mesh(gl, { geometry, program });

        function resize() {
            if (!gl || !gl.canvas) return;
            gl.canvas.width = window.innerWidth * 2.0;
            gl.canvas.height = window.innerHeight * 2.0;
            gl.canvas.style.width = window.innerWidth + "px";
            gl.canvas.style.height = window.innerHeight + "px";

            let resA1, resA2;
            if (window.innerHeight / window.innerWidth < imageAspect) {
                resA1 = 1;
                resA2 = window.innerHeight / window.innerWidth / imageAspect;
            } else {
                resA1 = window.innerWidth / window.innerHeight * imageAspect;
                resA2 = 1;
            }
            mesh.program.uniforms.res.value = new Vec4(
                window.innerWidth,
                window.innerHeight,
                resA1,
                resA2
            );

            renderer.setSize(window.innerWidth, window.innerHeight);
            aspect = window.innerWidth / window.innerHeight;
        }

        window.addEventListener("resize", resize, false);
        resize();

        function updateMouse(e) {
            if (!gl || !gl.renderer) return;
            // e.preventDefault(); // Don't prevent default, might break scroll
            let x = e.x;
            let y = e.y;
            if (e.changedTouches && e.changedTouches.length) {
                x = e.changedTouches[0].pageX;
                y = e.changedTouches[0].pageY;
            }
            if (x === undefined) {
                x = e.pageX;
                y = e.pageY;
            }
            
            mouse.set(x / window.innerWidth, 1.0 - y / window.innerHeight);

            if (!lastTime) {
                lastTime = performance.now();
                lastMouse.set(x, y);
            }

            const deltaX = x - lastMouse.x;
            const deltaY = y - lastMouse.y;
            lastMouse.set(x, y);
            const time = performance.now();
            const delta = Math.max(10.4, time - lastTime);
            lastTime = time;
            
            velocity.x = deltaX / delta;
            velocity.y = deltaY / delta;
            velocity.needsUpdate = true;
        }

        const isTouchCapable = "ontouchstart" in window;
        if (isTouchCapable) {
            window.addEventListener("touchstart", updateMouse, { passive: true });
            window.addEventListener("touchmove", updateMouse, { passive: true });
        } else {
            window.addEventListener("mousemove", updateMouse, { passive: true });
        }

        function update(t) {
            animationId = requestAnimationFrame(update);
            if (!velocity.needsUpdate) {
                mouse.set(-1);
                velocity.set(0);
            }
            velocity.needsUpdate = false;
            flowmap.aspect = aspect;
            flowmap.mouse.copy(mouse);
            flowmap.velocity.lerp(velocity, velocity.len ? 0.15 : 0.1);
            flowmap.update();
            program.uniforms.uTime.value = t * 0.01;
            renderer.render({ scene: mesh });
        }
        animationId = requestAnimationFrame(update);

        return () => {
            window.removeEventListener("resize", resize);
            if (isTouchCapable) {
                window.removeEventListener("touchstart", updateMouse);
                window.removeEventListener("touchmove", updateMouse);
            } else {
                window.removeEventListener("mousemove", updateMouse);
            }
            cancelAnimationFrame(animationId);
            if (containerRef.current && gl.canvas) {
                containerRef.current.removeChild(gl.canvas);
            }
        };
    }, []);

    return (
        <div className="fluid-text-container">
            <div className="fluid-canvas-wrapper" ref={containerRef} />
            <div className="fluid-text-mask">
                <h1 className="fluid-title" dangerouslySetInnerHTML={{ __html: text }}></h1>
            </div>
        </div>
    );
}
