import React, { useEffect, useMemo, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EstadoTela, TELA_H, TELA_W, desenharTela } from "./Tela";

// Celular 3D: "Realistic Smartphone 3D Model" por LukeModels75, CC BY 4.0
// https://sketchfab.com/3d-models/realistic-smartphone-3d-model-77e5794dde144965b5bd4aeab9cb50e8

export type Pose = {
  rotX: number; // inclinação (rad)
  rotY: number; // giro (rad)
  rotZ: number;
  y: number; // deslocamento vertical
  z: number; // aproximação da câmera
};

const MODELO = staticFile("3d/smartphone/scene.gltf");

// Carrega o modelo uma única vez, segurando a renderização até terminar.
const useModelo = () => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [handle] = useState(() => delayRender("Carregando modelo 3D"));
  useEffect(() => {
    new GLTFLoader().load(
      MODELO,
      (g) => {
        setGltf(g);
        continueRender(handle);
      },
      undefined,
      (err) => {
        console.error(err);
        continueRender(handle);
      },
    );
  }, [handle]);
  return gltf;
};

// Ambiente de estúdio procedural: duas "softboxes" que geram os reflexos no vidro e no metal.
const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color("#050510");
    const caixa = (w: number, h: number, pos: [number, number, number], intensidade: number, cor = "#ffffff") => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(intensidade), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    caixa(6, 1.4, [0, 6, 5], 6); // faixa de luz principal (reflexo que corre pela tela)
    caixa(3, 8, [-7, 1, 2], 2.2, "#c7d2fe"); // luz lateral fria
    caixa(3, 6, [7, -2, 3], 1.4, "#e9d5ff"); // contraluz roxa
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(env, 0.02);
    scene.environment = rt.texture;
    return () => {
      rt.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

// Mesa escura com textura sutil (couro/fosco) gerada em canvas.
const useTexturaMesa = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#16151c";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26000; i++) {
      const v = 18 + rnd() * 22;
      ctx.fillStyle = `rgba(${v},${v},${v + 6},${0.35 + rnd() * 0.4})`;
      ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

const Celular: React.FC<{ gltf: GLTF; pose: Pose; tela: EstadoTela }> = ({ gltf, pose, tela }) => {
  // Canvas da tela, redesenhado a cada frame.
  const { canvas, textura } = useMemo(() => {
    const c = document.createElement("canvas");
    // O UV da tela corre ao longo do eixo longo do modelo: o canvas é "deitado".
    c.width = TELA_H;
    c.height = TELA_W;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.flipY = false;
    return { canvas: c, textura: t };
  }, []);

  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.translate(0, TELA_W);
  ctx.rotate(-Math.PI / 2);
  // espelha na horizontal para casar com o UV do modelo
  ctx.translate(TELA_W, 0);
  ctx.scale(-1, 1);
  desenharTela(ctx, tela);
  ctx.restore();
  textura.needsUpdate = true;

  // Prepara o modelo: centraliza, normaliza a escala e troca os materiais.
  const modelo = useMemo(() => {
    const raiz = gltf.scene.clone(true);
    const caixa = new THREE.Box3().setFromObject(raiz);
    const tam = caixa.getSize(new THREE.Vector3());
    const centro = caixa.getCenter(new THREE.Vector3());
    const escala = 2 / Math.max(tam.x, tam.y, tam.z);
    raiz.position.sub(centro);
    const grupo = new THREE.Group();
    grupo.add(raiz);
    grupo.scale.setScalar(escala);

    // Vidro frontal: só soma os reflexos do ambiente à imagem da tela (aditivo, sem cor própria).
    const vidro = new THREE.MeshStandardMaterial({
      color: "#000000",
      metalness: 1,
      roughness: 0.05,
      envMapIntensity: 0.9,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    raiz.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const nome = (m.material as THREE.Material).name;
      if (m.name.startsWith("Glass001")) {
        // (o Three.js remove os pontos dos nomes: "Glass.001" vira "Glass001")
        // a tela fica logo abaixo do vidro frontal: avança 0,8 mm para não ser encoberta pelo corpo
        m.geometry = m.geometry.clone();
        m.geometry.translate(0, 0, 0.008);
        m.material = new THREE.MeshBasicMaterial({ map: textura, toneMapped: false, side: THREE.DoubleSide });
        m.renderOrder = 1;
      } else if (m.name.startsWith("Glass_Glass")) {
        m.material = vidro;
        m.renderOrder = 2;
      } else if (nome === "Material") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#2e2e36", metalness: 0.9, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
      } else if (nome === "Glass") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#0a0a12", metalness: 0.2, roughness: 0.05, clearcoat: 1 });
      } else if (nome === "Material.002") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#c9c9d2", metalness: 1, roughness: 0.18 });
      } else if (nome === "Cam1" || nome === "base") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#0b0b10", metalness: 0.3, roughness: 0.15, clearcoat: 1 });
      }
    });
    return grupo;
  }, [gltf, textura]);


  return (
    <group position={[0, pose.y, pose.z]} rotation={[pose.rotX, pose.rotY, pose.rotZ]}>
      {/* no modelo a frente aponta para +X: gira para ficar de frente para a câmera */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={modelo} />
      </group>
    </group>
  );
};

export const Celular3D: React.FC<{ pose: Pose; tela: EstadoTela; mesa?: boolean; cameraZ?: number }> = ({
  pose,
  tela,
  mesa = true,
  cameraZ = 5.2,
}) => {
  const { width, height } = useVideoConfig();
  const gltf = useModelo();
  const texMesa = useTexturaMesa();
  useCurrentFrame();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 30, position: [0, 0, cameraZ], near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      style={{ background: "#0d0c12" }}
    >
      <Ambiente />
      <ambientLight intensity={0.15} />
      <directionalLight position={[2, 4, 5]} intensity={1.2} />
      <spotLight position={[0, 3, 6]} angle={0.5} penumbra={1} intensity={30} color="#d4d0ff" />
      {mesa ? (
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial map={texMesa} roughness={0.85} metalness={0} color="#55525f" />
        </mesh>
      ) : null}
      {gltf ? <Celular gltf={gltf} pose={pose} tela={tela} /> : null}
    </ThreeCanvas>
  );
};
