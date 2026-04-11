import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

function GlossyBlobOrb({ isSpeaking, isListening }) {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene, Camera, Renderer ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 3; // Orb is now closer / bigger

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);
        
        // --- Lighting ---
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // State-based lights for emission effect
        const redLight = new THREE.PointLight(0xff0000, 0, 10);
        redLight.position.set(0, 0, 1);
        scene.add(redLight);

        const greenLight = new THREE.PointLight(0x00ff00, 0, 10);
        greenLight.position.set(0, 0, 1);
        scene.add(greenLight);

        // --- Geometry & Material ---
        const geometry = new THREE.IcosahedronGeometry(1.2, 64); // Slightly larger base geometry
        
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xd1d5db, // Light silver/grey base color
            metalness: 0.8,
            roughness: 0.1,
            transmission: 0.9,
            transparent: true,
            ior: 1.2,
            reflectivity: 0.8,
            envMapIntensity: 1.5,
        });

        const uniforms = {
            u_time: { value: 0 },
            u_intensity: { value: 0.0 },
            u_color_red: { value: new THREE.Color(0xffaaaa) },
            u_color_green: { value: new THREE.Color(0xaaffaa) },
            u_color_blue: { value: new THREE.Color(0xaaaaff) },
        };

        material.onBeforeCompile = shader => {
            shader.uniforms = { ...shader.uniforms, ...uniforms };
            shader.vertexShader = `
                uniform float u_time;
                uniform float u_intensity;
                varying vec3 v_normal;
                varying vec3 v_position;

                // GLSL Simplex Noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 =   v - i + dot(i, C.xxx);
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }
                ${shader.vertexShader}
            `.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                v_normal = normal;
                v_position = position;
                float noise = snoise(position * 1.5 + u_time * 0.3) * 0.2;
                float spike = snoise(position * 4.0 + u_time * 0.5) * u_intensity * 0.3;
                transformed += normal * (noise + spike);`
            );

            // Fragment shader for lighter, mixed colors
            shader.fragmentShader = `
                uniform vec3 u_color_red;
                uniform vec3 u_color_green;
                uniform vec3 u_color_blue;
                varying vec3 v_normal;
                varying vec3 v_position;
                ${shader.fragmentShader}
            `.replace(
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `
                float r_factor = (sin(v_position.x * 2.0) + 1.0) * 0.5;
                float g_factor = (cos(v_position.y * 2.0) + 1.0) * 0.5;
                float b_factor = (sin(v_position.z * 2.0) + 1.0) * 0.5;

                vec3 mixed_color_a = mix(u_color_red, u_color_green, r_factor);
                vec3 mixed_color_b = mix(mixed_color_a, u_color_blue, g_factor);
                
                float fresnel = 1.0 - dot(normalize(v_normal), vec3(0.0, 0.0, 1.0));
                fresnel = pow(fresnel, 2.0);

                vec3 final_color = mix(diffuse, mixed_color_b, fresnel * 0.8);

                vec4 diffuseColor = vec4( final_color, opacity );`
            );
        };

        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            
            // Update uniforms for shaders
            uniforms.u_time.value = elapsed;
            uniforms.u_intensity.value += ((isSpeaking ? 1.0 : 0.0) - uniforms.u_intensity.value) * 0.1;

            // Update light intensities for emission effect
            redLight.intensity += ((isSpeaking ? 2.5 : 0.0) - redLight.intensity) * 0.1;
            greenLight.intensity += ((isListening ? 2.5 : 0.0) - greenLight.intensity) * 0.1;

            renderer.render(scene, camera);
        };
        animate();

        // --- Cleanup ---
        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            if (mountRef.current && renderer.domElement) {
              mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [isSpeaking, isListening]); // Rerun effect if state changes

    return <div ref={mountRef} className="w-full h-full" />;
}

export default GlossyBlobOrb;