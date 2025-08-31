'use client';

import { WebGPUCanvas } from '@/components/landing-page/components/canvas';
import { useAspect, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useContext, useMemo } from 'react';
import { Tomorrow } from 'next/font/google';
import gsap from 'gsap';

import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

import * as THREE from 'three/webgpu';
import { useGSAP } from '@gsap/react';
import { PostProcessing } from '@/components/landing-page/components/post-processing';
import { ContextProvider, GlobalContext } from '@/context';


const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

const WIDTH = 1600;
const HEIGHT = 900;

const Scene = () => {
  const { setIsLoading } = useContext(GlobalContext);

  const [rawMap, depthMap, edgeMap] = useTexture(
    ['/raw-5.png', '/depth-4.png'],
    () => {
      setIsLoading(false);
      rawMap.colorSpace = THREE.SRGBColorSpace;
    }
  );

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;

    const tDepthMap = texture(depthMap);
    // const tEdgeMap = texture(edgeMap);

    const tMap = texture(
      rawMap,
      uv().add(tDepthMap.r.mul(uPointer).mul(strength))
    ).mul(0.5);const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = tDepthMap;

    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.sub(uProgress))));

    

    const mask = dot.mul(flow).mul(vec3(10, 0.4, 10));

    const final = blendScreen(tMap, mask);

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
    });

    return {
      material,
      uniforms: {
        uPointer,
        uProgress,
      },
    };
  }, [rawMap, depthMap, edgeMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useGSAP(() => {
    gsap.to(uniforms.uProgress, {
      value: 1,
      repeat: -1,
      duration: 3,
      ease: 'power1.out',
    });
  }, [uniforms.uProgress]);

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  return (
    <mesh scale={[w, h, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

const Html3 = () => {
  const { isLoading } = useContext(GlobalContext);

  useGSAP(() => {
    if (!isLoading) {
      gsap
        .timeline()
        .to('[data-loader]', {
          opacity: 0,
        })
        .from('[data-title]', {
          yPercent: -100,
          stagger: {
            each: 0.15,
          },
          ease: 'power1.out',
        })
        .from('[data-desc]', {
          opacity: 0,
          yPercent: 100,
        });
    }
  }, [isLoading]);

  return (
    <div>
      <div
        className="h-svh fixed z-90 bg-indigo-950 pointer-events-none w-full flex justify-center items-center"
        data-loader
      >
        <div className="w-6 h-6 bg-white animate-ping rounded-full"></div>
      </div>
      <div className="h-svh">
        <div className="absolute flex top-6 left-6 md:top-8 md:left-8 z-70 pointer-events-none items-center">
          <img 
            src="/devfun-logo3.png" 
            alt="DevFun Logo" 
            className="w-8 h-8 md:w-12 md:h-12 object-contain mr-2"
          />
          <span>pumpanalytics</span>
        </div>
        <div className="h-svh uppercase items-center w-full absolute z-60 pointer-events-none px-10 flex justify-center flex-col">
          <div
            className="text-4xl md:text-7xl xl:text-8xl 2xl:text-9xl text-white"
            style={{
              ...tomorrow.style,
            }}
          >
            <div className="flex space-x-2 lg:space-x-6 overflow-hidden">
              {'pumpanalytics'.split(' ').map((word, index) => {
                return (
                  <div data-title key={index} className="text-white">
                    {word}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center text-xs md:text-xl xl:text-2xl 2xl:text-3xl mt-2 overflow-hidden text-white">
            <div data-desc>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-white/80">Scan any wallet's pump.fun losses</div>
                <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
                  <a 
                    className="w-full md:w-auto relative h-12 px-8 rounded-lg overflow-hidden transition-all duration-500 group pointer-events-auto flex items-center justify-center" 
                    href="https://pumpnut-fun.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  > 
                    <div 
                      className="absolute inset-0 rounded-lg p-[2px] bg-gradient-to-b from-[#654358] via-[#17092A] to-[#2F0D64]" 
                    > 
                      <div className="absolute inset-0 bg-[#170928] rounded-lg opacity-90"></div> 
                    </div> 
                    <div className="absolute inset-[2px] bg-[#170928] rounded-lg opacity-95"></div> 
                    <div 
                      className="absolute inset-[2px] bg-gradient-to-r from-[#170928] via-[#1d0d33] to-[#170928] rounded-lg opacity-90" 
                    ></div> 
                    <div 
                      className="absolute inset-[2px] bg-gradient-to-b from-[#654358]/40 via-[#1d0d33] to-[#2F0D64]/30 rounded-lg opacity-80" 
                    ></div> 
                    <div 
                      className="absolute inset-[2px] bg-gradient-to-br from-[#C787F6]/10 via-[#1d0d33] to-[#2A1736]/50 rounded-lg" 
                    ></div> 
                    <div 
                      className="absolute inset-[2px] shadow-[inset_0_0_15px_rgba(199,135,246,0.15)] rounded-lg" 
                    ></div> 
                    <div className="relative flex items-center justify-center gap-2"> 
                      <span 
                        className="text-lg font-normal bg-gradient-to-b from-[#D69DDE] to-[#B873F8] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(199,135,246,0.4)] tracking-tighter" 
                      > 
                        Try $PUMPA
                      </span> 
                    </div> 
                    <div 
                      className="absolute inset-[2px] opacity-0 transition-opacity duration-300 bg-gradient-to-r from-[#2A1736]/20 via-[#C787F6]/10 to-[#2A1736]/20 group-hover:opacity-100 rounded-lg" 
                    ></div> 
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <WebGPUCanvas>
          <PostProcessing></PostProcessing>
          <Scene></Scene>
        </WebGPUCanvas>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <ContextProvider>
      <Html3></Html3>
    </ContextProvider>
  );
}
