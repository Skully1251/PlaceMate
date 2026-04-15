import React, { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Sphere, shaderMaterial } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';

// --- Custom Shader for the Internal Wavy Plates ---
const WaveMaterial = shaderMaterial(
  { u_time: 0, u_amplitude: 0.1, u_color: new THREE.Color(0.0, 0.0, 0.0) },
  ` uniform float u_time;
    uniform float u_amplitude;
    varying vec2 v_uv;
    void main() {
      v_uv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 5.0 + u_time * 0.8) * u_amplitude;
      pos.z += cos(pos.y * 4.0 + u_time * 0.5) * u_amplitude;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }`,
  ` uniform vec3 u_color;
    varying vec2 v_uv;
    void main() {
      float strength = 1.0 - distance(v_uv, vec2(0.5)) * 2.0;
      gl_FragColor = vec4(u_color, strength * 0.3);
    }`
);

extend({ WaveMaterial });

// --- The Main Scene Component ---
function Scene({ isSpeaking, isListening }) {
  const glassRef = useRef();
  const waveRef1 = useRef();
  const waveRef2 = useRef();

  // Spring animation for the main orb's emissive (glow) color and opacity
  const { emissiveColor, opacity } = useSpring({
    opacity: isSpeaking ? 0.25 : 0.4,
    emissiveColor: isListening ? '#16a34a' : (isSpeaking ? '#db2777' : '#4f46e5'),
    config: { mass: 1, tension: 120, friction: 26 },
  });
  
  // Spring animation for the internal waves' amplitude
  const { waveAmplitude } = useSpring({
      waveAmplitude: isSpeaking ? 0.35 : 0.05,
      config: { mass: 2, tension: 100, friction: 20 }
  });

  // Spring animation for the orb's physical deformation
  const { deformationIntensity } = useSpring({
      deformationIntensity: isSpeaking ? 0.4 : 0.05,
      config: { mass: 1, tension: 150, friction: 20 }
  });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (waveRef1.current) {
        waveRef1.current.uniforms.u_time.value = time;
        waveRef1.current.uniforms.u_color.value.set('#c084fc');
        waveRef1.current.uniforms.u_amplitude.value = waveAmplitude.get();
    }
    if (waveRef2.current) {
        waveRef2.current.uniforms.u_time.value = time * 0.8;
        waveRef2.current.uniforms.u_color.value.set(emissiveColor.get());
        waveRef2.current.uniforms.u_amplitude.value = waveAmplitude.get();
    }
    if (glassRef.current && glassRef.current.material.userData.shader) {
        glassRef.current.material.userData.shader.uniforms.u_time.value = time;
        glassRef.current.material.userData.shader.uniforms.u_intensity.value = deformationIntensity.get();
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 5]} intensity={1.5} />
      
      {/* The main deforming glassy orb - Same large size */}
      <Sphere ref={glassRef} args={[9, 128, 128]}>
          <a.meshPhysicalMaterial
            transmission={1.0} thickness={1.5} roughness={0.05} ior={1.33}
            color={"#ffffff"}
            emissive={emissiveColor} emissiveIntensity={1.2}
            opacity={opacity} transparent={true}
            onBeforeCompile={(shader) => {
              glassRef.current.material.userData.shader = shader;
              shader.uniforms.u_time = { value: 0 };
              shader.uniforms.u_intensity = { value: 0.0 };
              shader.uniforms.u_color_purple = { value: new THREE.Color("#c084fc") };
              shader.uniforms.u_color_blue = { value: new THREE.Color("#60a5fa") };
              shader.uniforms.u_color_green = { value: new THREE.Color("#4ade80") };

              // --- THIS IS THE FIX: Correctly injecting GLSL code ---
              const vertexShaderPrefix = `
                uniform float u_time;
                uniform float u_intensity;
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
                    vec3 x0 = v - i + dot(i, C.xxx);
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
              `;
              
              shader.vertexShader = vertexShaderPrefix + shader.vertexShader;
              shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                v_position = position;
                float noise = snoise(position * 2.0 + u_time * 0.5) * u_intensity;
                transformed += normal * noise;`
              );
              
              const fragmentShaderPrefix = `
                uniform vec3 u_color_purple;
                uniform vec3 u_color_blue;
                uniform vec3 u_color_green;
                varying vec3 v_position;
              `;
              
              shader.fragmentShader = fragmentShaderPrefix + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace(
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `
                float mix1 = smoothstep(-1.0, 1.0, v_position.x);
                float mix2 = smoothstep(-1.0, 1.0, v_position.y);
                vec3 color1 = mix(u_color_purple, u_color_blue, mix1);
                vec3 final_color = mix(color1, u_color_green, mix2);
                vec4 diffuseColor = vec4( final_color, opacity );
                `
              );
            }}
          />
      </Sphere>

      {/* Internal Wavy Plates - Same large size */}
      <mesh scale={[9, 9, 9]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.5, 2.5, 38, 38]} />
        <waveMaterial ref={waveRef1} transparent={true} depthWrite={false} />
      </mesh>
       <mesh scale={[9, 9, 9]} rotation={[0.5, 0.8, 0.2]}>
        <planeGeometry args={[1, 1, 32, 32]} />
        <waveMaterial ref={waveRef2} transparent={true} depthWrite={false} />
      </mesh>
    </>
  );
}

// --- Main Export Component ---
export default function BlocksOrb({ isSpeaking, isListening }) {
  // Pull camera back much further to view the massive orb
  return (
    <Canvas camera={{ position: [0, 0, 16] }}>
      <Scene isSpeaking={isSpeaking} isListening={isListening} />
    </Canvas>
  );
}