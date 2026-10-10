import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EstadoTela, TELA_H, TELA_W, desenharTela } from "./Tela";

// Celular 3D: "Realistic Smartphone 3D Model" por LukeModels75, CC BY 4.0
// https://sketchfab.com/3d-models/realistic-smartphone-3d-model-77e5794dde144965b5bd4aeab9cb50e8

export type Pose = {
  x?: number; // deslocamento lateral
  rotX: number; // inclinação (rad)
  rotY: number; // giro (rad)
  rotZ: number;
  y: number; // deslocamento vertical
  z: number; // aproximação da câmera
};

const MODELO = staticFile("3d/smartphone/scene.gltf");

// Carrega o modelo uma única vez (cache entre cenas) e só libera a renderização
// depois que o celular já foi montado e desenhado, evitando quadros sem o celular.
let promessaModelo: Promise<GLTF> | null = null;
const carregarModelo = () => {
  if (!promessaModelo) {
    promessaModelo = new Promise<GLTF>((resolve, reject) => new GLTFLoader().load(MODELO, resolve, undefined, reject));
  }
  return promessaModelo;
};

const useModelo = (segurar: (h: number) => void) => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [handle] = useState(() => delayRender("Carregando modelo 3D"));
  useEffect(() => {
    carregarModelo()
      .then((g) => {
        // a captura só é liberada depois do redesenho com o modelo montado
        segurar(handle);
        setGltf(g);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle, segurar]);
  return gltf;
};

// Ambiente de estúdio procedural: duas "softboxes" que geram os reflexos no vidro e no metal.
const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const env = new THREE.Scene();
    // fundo médio: o metal reflete um gradiente de estúdio, não um vazio preto
    env.background = new THREE.Color("#4a4862");
    const caixa = (w: number, h: number, pos: [number, number, number], intensidade: number, cor = "#ffffff") => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(intensidade), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    caixa(6, 1.4, [0, 6, 5], 7); // faixa de luz principal (reflexo que corre pela tela)
    caixa(3, 8, [-7, 1, 2], 3, "#c7d2fe"); // luz lateral fria
    caixa(3, 6, [7, -2, 3], 2.4, "#e9d5ff"); // contraluz roxa
    caixa(8, 3, [0, -6, 2], 1.2); // rebatedor de baixo (ilumina as laterais)
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

// O ThreeCanvas só redesenha quando o número do quadro muda. Quando algo chega depois
// (modelo carregado, quadro novo do vídeo da tela), forçamos um redesenho.
const Redesenhar: React.FC<{ versao: number; aoRedesenhar: () => void }> = ({ versao, aoRedesenhar }) => {
  const { advance, invalidate } = useThree();
  useEffect(() => {
    advance(performance.now());
    invalidate();
    // o redesenho acima é síncrono: a imagem já está no canvas, pode liberar a captura
    aoRedesenhar();
  }, [versao, advance, invalidate, aoRedesenhar]);
  return null;
};

// Guarda a função `advance` do R3F para redesenhar o 3D de forma síncrona fora da árvore 3D.
const ExporAvanco: React.FC<{ alvo: React.MutableRefObject<((t: number) => void) | null> }> = ({ alvo }) => {
  const { advance } = useThree();
  useEffect(() => {
    alvo.current = advance;
    return () => {
      alvo.current = null;
    };
  }, [advance, alvo]);
  return null;
};

// Superfície clara (lavanda, como o site) com textura fosca sutil gerada em canvas.
const useTexturaMesa = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ECEAF6";
    ctx.fillRect(0, 0, 512, 512);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26000; i++) {
      const v = 215 + rnd() * 30;
      ctx.fillStyle = `rgba(${v - 6},${v - 6},${v},${0.25 + rnd() * 0.3})`;
      ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

// Canvas "deitado" que vira a textura da tela (o UV corre ao longo do eixo longo do modelo).
const useCanvasTela = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TELA_H;
    c.height = TELA_W;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.flipY = false;
    const ctx = c.getContext("2d")!;
    // Desenha em coordenadas "retrato" (TELA_W x TELA_H), girando e espelhando para casar com o UV.
    const pintar = (desenho: (ctx: CanvasRenderingContext2D) => void) => {
      ctx.save();
      ctx.translate(0, TELA_W);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(TELA_W, 0);
      ctx.scale(-1, 1);
      desenho(ctx);
      ctx.restore();
      t.needsUpdate = true;
    };
    return { textura: t, pintar };
  }, []);

const Celular: React.FC<{ gltf: GLTF; pose: Pose; textura: THREE.Texture }> = ({ gltf, pose, textura }) => {
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
      roughness: 0.16, // levemente difuso: o reflexo do refletor vira um brilho suave, não um ponto
      envMapIntensity: 0.45,
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
        m.castShadow = false;
        return;
      } else if (nome === "Material") {
        // titânio natural: claro o bastante para as laterais mostrarem volume
        m.material = new THREE.MeshPhysicalMaterial({ color: "#9a9aa6", metalness: 0.7, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.2 });
      } else if (nome === "Glass") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#0a0a12", metalness: 0.2, roughness: 0.05, clearcoat: 1 });
      } else if (nome === "Material.002") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#c9c9d2", metalness: 1, roughness: 0.18 });
      } else if (nome === "Cam1" || nome === "base") {
        m.material = new THREE.MeshPhysicalMaterial({ color: "#0b0b10", metalness: 0.3, roughness: 0.15, clearcoat: 1 });
      }
      m.castShadow = true;
    });
    return grupo;
  }, [gltf, textura]);


  return (
    <group position={[pose.x ?? 0, pose.y, pose.z]} rotation={[pose.rotX, pose.rotY, pose.rotZ]}>
      {/* no modelo a frente aponta para +X: gira para ficar de frente para a câmera */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={modelo} />
      </group>
    </group>
  );
};

// `tela`: tela de bloqueio desenhada em canvas. `video`: vídeo com o conteúdo da tela
// (gerado pelas composições Tela*), sincronizado quadro a quadro com a cena.
export const Celular3D: React.FC<{
  pose: Pose;
  tela?: EstadoTela;
  video?: string;
  brilho?: number;
  mesa?: boolean;
  cameraZ?: number;
}> = ({ pose, tela, video, brilho = 1, mesa = true, cameraZ = 5.2 }) => {
  const { width, height } = useVideoConfig();
  // capturas pendentes: liberadas logo após o próximo redesenho do 3D
  const pendentes = useRef<number[]>([]);
  const segurar = useCallback((h: number) => {
    pendentes.current.push(h);
    // trava de segurança: nunca segura a captura por mais de 1,5 s
    setTimeout(() => {
      const i = pendentes.current.indexOf(h);
      if (i >= 0) {
        pendentes.current.splice(i, 1);
        continueRender(h);
      }
    }, 1500);
  }, []);
  const avanco = useRef<((t: number) => void) | null>(null);
  const liberar = useCallback(() => {
    const hs = pendentes.current;
    pendentes.current = [];
    hs.forEach((h) => continueRender(h));
  }, []);
  const gltf = useModelo(segurar);
  const texMesa = useTexturaMesa();
  const { textura, pintar } = useCanvasTela();
  const [tick, setTick] = useState(0);
  useCurrentFrame();

  if (tela) pintar((ctx) => desenharTela(ctx, tela));

  // Cada quadro do vídeo da tela é pintado no canvas e o 3D é redesenhado na hora.
  // A função é estável (useCallback + ref) para não disparar de novo a entrega do mesmo quadro.
  const brilhoRef = useRef(brilho);
  brilhoRef.current = brilho;
  const aoQuadro = useCallback(
    (img: CanvasImageSource) => {
      pintar((ctx) => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, TELA_W, TELA_H);
        ctx.globalAlpha = brilhoRef.current;
        ctx.drawImage(img, 0, 0, TELA_W, TELA_H);
      });
      if (avanco.current) {
        // redesenho síncrono: a imagem nova já está no 3D antes da captura
        avanco.current(performance.now());
      } else {
        // o 3D ainda não foi criado: segura a captura até o primeiro redesenho
        segurar(delayRender("Tela do celular 3D"));
        setTick((n) => n + 1);
      }
    },
    [pintar, segurar],
  );

  return (
    <>
    {video ? (
      <OffthreadVideo src={video} muted crossOrigin="anonymous" onVideoFrame={aoQuadro} style={{ position: "absolute", width: 2, height: 2, opacity: 0 }} />
    ) : null}
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 30, position: [0, 0, cameraZ], near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      shadows
      style={{ background: "#ECEAF6" }}
    >
      <Ambiente />
      <ambientLight intensity={0.55} />
      {/* luz principal vinda de cima à esquerda: projeta a sombra do celular na superfície */}
      <directionalLight
        position={[-2.5, 3.5, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-radius={8}
        shadow-bias={-0.0005}
      />
      <spotLight position={[3, 2, 6]} angle={0.6} penumbra={1} intensity={25} color="#e0dcff" />
      {mesa ? (
        <mesh position={[0, 0, -1.3]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial map={texMesa} roughness={0.9} metalness={0} color="#ffffff" />
        </mesh>
      ) : null}
      {gltf ? <Celular gltf={gltf} pose={pose} textura={textura} /> : null}
      <Redesenhar versao={tick * 2 + (gltf ? 1 : 0)} aoRedesenhar={liberar} />
      <ExporAvanco alvo={avanco} />
    </ThreeCanvas>
    </>
  );
};
