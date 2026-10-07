/**
 * SyncyRobot3D.jsx
 * Floating 3D Syncy mascot built from three.js primitives (no model file needed).
 *
 * - Floats up and down
 * - Head and body follow the cursor anywhere on the screen
 * - Waves "hi" with one hand 3 seconds after it mounts (click the robot to wave again)
 * - mood: 'idle' | 'thinking' | 'happy'
 */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (x) => x * x * (3 - 2 * x);

const WHITE = { color: '#f1f1f3', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 };
const BLACK = { color: '#0a0b0d', roughness: 0.4, clearcoat: 0.5 };

/* ---------- face drawn on a canvas, wrapped around the visor ---------- */
function drawFace(mood) {
  const W = 1024;
  const H = 768;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // visor shape (transparent outside, so the white shell shows as the bezel)
  g.fillStyle = '#050608';
  g.beginPath();
  g.ellipse(W / 2, H / 2, W / 2 - 2, H / 2 - 2, 0, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = '#ffffff';
  g.fillStyle = '#ffffff';
  g.lineCap = 'round';
  g.lineWidth = 28;

  if (mood === 'thinking') {
    [0.34, 0.66].forEach((x) => {
      g.beginPath();
      g.arc(W * x, H * 0.44, 30, 0, Math.PI * 2);
      g.fill();
    });
    g.beginPath();
    g.moveTo(W * 0.44, H * 0.68);
    g.lineTo(W * 0.56, H * 0.68);
    g.stroke();
  } else {
    // happy eyes (^ ^) and smile
    [0.31, 0.69].forEach((x) => {
      g.beginPath();
      g.arc(W * x, H * 0.47, 58, Math.PI, Math.PI * 2);
      g.stroke();
    });
    g.beginPath();
    g.arc(W / 2, H * 0.58, 92, Math.PI * 0.14, Math.PI * 0.86);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- soft studio reflections for the glossy plastic look ---------- */
function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ---------- one arm: white sleeve, black forearm and hand ---------- */
function Arm({ side, armRef, foreRef }) {
  return (
    <group ref={armRef} position={[side * 0.7, 0.34, 0]}>
      <mesh>
        <sphereGeometry args={[0.17, 32, 24]} />
        <meshPhysicalMaterial {...WHITE} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <capsuleGeometry args={[0.13, 0.16, 12, 24]} />
        <meshPhysicalMaterial {...WHITE} />
      </mesh>
      {/* elbow pivot: this is the part that swings while waving */}
      <group ref={foreRef} position={[0, -0.42, 0]}>
        <mesh position={[0, -0.17, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 8, 16]} />
          <meshPhysicalMaterial {...BLACK} />
        </mesh>
        <mesh position={[0, -0.4, 0]} scale={[0.9, 1.15, 0.7]}>
          <sphereGeometry args={[0.1, 24, 18]} />
          <meshPhysicalMaterial {...BLACK} />
        </mesh>
      </group>
    </group>
  );
}

function Robot({ pointer, mood, waveDelay, waveDuration, reduce, onWave }) {
  const root = useRef();
  const head = useRef();
  const body = useRef();
  const armR = useRef();
  const foreR = useRef();
  const armL = useRef();
  const foreL = useRef();
  const ringMat = useRef();
  const visorMat = useRef();
  const shadow = useRef();

  const clock = useThree((s) => s.clock);
  const waveStart = useRef(reduce ? Infinity : waveDelay);
  const hopStart = useRef(-100);

  const faces = useMemo(() => ({ idle: drawFace('idle'), thinking: drawFace('thinking') }), []);
  const shadowTex = useMemo(() => makeShadowTexture(), []);

  // egg-shaped body, wide shoulders tapering to the bottom
  const bodyGeo = useMemo(() => {
    const spline = new THREE.SplineCurve([
      new THREE.Vector2(0, -0.78),
      new THREE.Vector2(0.2, -0.68),
      new THREE.Vector2(0.42, -0.42),
      new THREE.Vector2(0.58, -0.1),
      new THREE.Vector2(0.66, 0.2),
      new THREE.Vector2(0.62, 0.42),
      new THREE.Vector2(0.38, 0.54),
      new THREE.Vector2(0, 0.55),
    ]);
    const pts = spline.getPoints(48).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
    return new THREE.LatheGeometry(pts, 48);
  }, []);

  useEffect(
    () => () => {
      faces.idle.dispose();
      faces.thinking.dispose();
      shadowTex.dispose();
      bodyGeo.dispose();
    },
    [faces, shadowTex, bodyGeo]
  );

  // swap the face when the mood changes
  useEffect(() => {
    const m = visorMat.current;
    if (!m) return;
    const f = mood === 'thinking' ? faces.thinking : faces.idle;
    m.map = f;
    m.emissiveMap = f;
    m.needsUpdate = true;
    if (mood === 'happy') hopStart.current = clock.elapsedTime;
  }, [mood, faces, clock]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const damp = (a, b, lambda) => THREE.MathUtils.damp(a, b, lambda, dt);
    const thinking = mood === 'thinking';

    // floating (+ a small hop when mood becomes 'happy')
    const bob = reduce ? 0 : Math.sin(t * (thinking ? 3 : 1.6)) * 0.07;
    const since0 = t - hopStart.current;
    const hop = Math.max(0, Math.sin(since0 * 9)) * Math.exp(-since0 * 2.5) * 0.18;
    if (root.current) {
      root.current.position.y = -0.155 + bob + hop;
      root.current.rotation.z = reduce ? 0 : Math.sin(t * 0.9) * 0.03;
    }

    if (shadow.current) {
      const s = 1 - (bob + hop) * 2.5;
      shadow.current.scale.set(s, s, s);
    }

    // cursor following
    if (head.current) {
      head.current.rotation.y = damp(head.current.rotation.y, p.x * 0.75, 6);
      head.current.rotation.x = damp(head.current.rotation.x, -p.y * 0.45 + (thinking ? -0.12 : 0), 6);
      head.current.rotation.z = damp(head.current.rotation.z, -p.x * 0.08, 6);
    }
    if (body.current) {
      body.current.rotation.y = damp(body.current.rotation.y, p.x * 0.25, 4);
    }

    // wave: raise arm, swing forearm, lower arm
    const since = t - waveStart.current;
    let w = 0;
    if (since > 0 && since < waveDuration) {
      w = ease(clamp(Math.min(since, waveDuration - since) / 0.5, 0, 1));
    }
    const swing = w > 0 ? Math.sin(since * 10) * 0.5 * w : 0;
    const idleSway = reduce ? 0 : Math.sin(t * 1.3) * 0.03;

    if (armR.current && foreR.current && armL.current && foreL.current) {
      armR.current.rotation.z = THREE.MathUtils.lerp(0.14 + idleSway, 2.55, w);
      foreR.current.rotation.z = swing - w * 0.1;
      armL.current.rotation.z = -0.14 - idleSway;
      foreL.current.rotation.z = 0;
    }

    // chest ring pulses while thinking
    if (ringMat.current) {
      ringMat.current.emissiveIntensity = thinking ? 1.2 + Math.sin(t * 6) * 0.8 : 1;
    }
  });

  const wave = () => {
    waveStart.current = clock.elapsedTime;
    onWave?.();
  };

  return (
    <>
      <group
        ref={root}
        onClick={wave}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* head */}
        <group ref={head} position={[0, 0.78, 0]}>
          <mesh scale={[1.1, 1, 0.95]}>
            <sphereGeometry args={[0.78, 64, 48]} />
            <meshPhysicalMaterial {...WHITE} />
          </mesh>

          {/* visor: a curved patch of the sphere carrying the face texture */}
          <mesh scale={[1.1, 1, 0.95]}>
            <sphereGeometry
              args={[0.78 * 1.012, 64, 48, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.7, 1.4]}
            />
            <meshPhysicalMaterial
              ref={visorMat}
              map={faces.idle}
              emissiveMap={faces.idle}
              emissive="#ffffff"
              emissiveIntensity={0.9}
              roughness={0.12}
              clearcoat={1}
              clearcoatRoughness={0.05}
              alphaTest={0.5}
              alphaToCoverage
            />
          </mesh>

          {/* ear pads */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.88, 0, 0]} scale={[0.1, 0.27, 0.22]}>
              <sphereGeometry args={[1, 32, 24]} />
              <meshPhysicalMaterial {...WHITE} />
            </mesh>
          ))}
        </group>

        {/* neck */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.22, 24]} />
          <meshPhysicalMaterial {...BLACK} />
        </mesh>

        {/* body, chest ring and arms */}
        <group ref={body} position={[0, -0.45, 0]}>
          <mesh geometry={bodyGeo} scale={[1, 1, 0.85]}>
            <meshPhysicalMaterial {...WHITE} />
          </mesh>

          <group position={[0.22, 0.12, 0.54]} rotation={[0, 0.28, 0]}>
            <mesh>
              <torusGeometry args={[0.115, 0.028, 16, 48]} />
              <meshStandardMaterial ref={ringMat} color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[0, 0, -0.005]}>
              <circleGeometry args={[0.1, 32]} />
              <meshBasicMaterial color="#050608" />
            </mesh>
          </group>

          {/* side=+1 is the arm on the right of the screen: it does the waving */}
          <Arm side={1} armRef={armR} foreRef={foreR} />
          <Arm side={-1} armRef={armL} foreRef={foreL} />
        </group>
      </group>

      {/* ground shadow */}
      <mesh ref={shadow} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

export default function SyncyRobot3D({
  size = 180,
  mood = 'idle',
  waveDelay = 3,
  waveDuration = 3,
  dprMax,
  onWave,
  className,
  style,
}) {
  const wrap = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const reduce = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // track the cursor across the whole window, relative to the robot's head
  useEffect(() => {
    const onMove = (e) => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      pointer.current.x = clamp((e.clientX - cx) / (window.innerWidth * 0.5), -1, 1);
      pointer.current.y = clamp(-(e.clientY - cy) / (window.innerHeight * 0.5), -1, 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const dpr = dprMax ? [1, dprMax] : [1, 2];

  return (
    <div
      ref={wrap}
      className={className}
      role="img"
      aria-label="Syncy, the SyncCanvas assistant"
      style={{ width: size, height: size * 1.25, ...style }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.2, 6.8], fov: 28 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent', touchAction: 'pan-y' }}
      >
        <Env />
        <ambientLight intensity={0.35} />
        <directionalLight position={[2.5, 3, 4]} intensity={2.2} />
        <directionalLight position={[-3, 2, -2]} intensity={2.4} />
        <directionalLight position={[3, 0.5, -2]} intensity={1.2} />
        <Robot
          pointer={pointer}
          mood={mood}
          waveDelay={waveDelay}
          waveDuration={waveDuration}
          reduce={reduce}
          onWave={onWave}
        />
      </Canvas>
    </div>
  );
}
