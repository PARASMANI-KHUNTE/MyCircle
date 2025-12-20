import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

const AnimatedSphere = () => {
    const sphereRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (sphereRef.current) {
            sphereRef.current.position.y = Math.sin(time) * 0.2;
            sphereRef.current.rotation.x = time * 0.2;
            sphereRef.current.rotation.y = time * 0.3;
        }
    });

    return (
        <Sphere ref={sphereRef} args={[1, 100, 200]} scale={2.4}>
            <MeshDistortMaterial
                color="#8b5cf6"
                attach="material"
                distort={0.4}
                speed={1.5}
                roughness={0.2}
                metalness={0.9} // Glassy metallic look
            />
        </Sphere>
    );
};

const HeroScene = () => {
    return (
        <div className="absolute top-0 right-0 w-[50%] h-[600px] z-[-1] pointer-events-none opacity-50 md:opacity-100">
            <Canvas>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <AnimatedSphere />
            </Canvas>
        </div>
    );
};

export default HeroScene;
