import { useRef, useEffect, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { usePlinko } from "@/lib/stores/usePlinko";

const ROWS = 9;
const COLS = 10;
const PIN_RADIUS = 0.15;
const PIN_HEIGHT = 0.6;
const PIN_SPACING_X = 1.2;
const PIN_SPACING_Y = 0.9;
const BALL_RADIUS = 0.35;
const BOARD_WIDTH = 12;

const SLOT_MULTIPLIERS = [0.2, 0.5, 1, 3, 10];
const NUM_SLOTS = 5;

interface BallData {
  id: string;
  mesh: THREE.Mesh;
  body: CANNON.Body;
  geometry: THREE.SphereGeometry;
  material: THREE.MeshStandardMaterial;
}

export function PlinkoBoard() {
  const worldRef = useRef<CANNON.World | null>(null);
  const ballsRef = useRef<BallData[]>([]);
  const lastDropTimeRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Group>(null);
  
  const { 
    incrementActiveBalls: dropBall, 
    setLastWin: addWin, 
    decrementActiveBalls: removeBall, 
    autoDrop, 
    money, 
    betAmount, 
    activeBalls 
  } = usePlinko();
  
  const pinPositions = useMemo(() => {
    const positions: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < ROWS; row++) {
      const offsetX = (row % 2) * (PIN_SPACING_X / 2);
      for (let col = 0; col < COLS; col++) {
        const x = (col - COLS / 2 + 0.5) * PIN_SPACING_X + offsetX;
        const y = 8 - row * PIN_SPACING_Y;
        positions.push({ x, y });
      }
    }
    return positions;
  }, []);
  
  useEffect(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -15, 0);
    
    world.defaultContactMaterial.friction = 0.1;
    world.defaultContactMaterial.restitution = 0.5;
    
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -0.5, 0);
    world.addBody(groundBody);
    
    const wallLeft = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.2, 10, 1)),
      position: new CANNON.Vec3(-BOARD_WIDTH / 2 - 0.2, 4, 0),
    });
    world.addBody(wallLeft);
    
    const wallRight = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.2, 10, 1)),
      position: new CANNON.Vec3(BOARD_WIDTH / 2 + 0.2, 4, 0),
    });
    world.addBody(wallRight);
    
    const wallBack = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.2)),
      position: new CANNON.Vec3(0, 4, -0.5),
    });
    world.addBody(wallBack);
    
    const wallFront = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.2)),
      position: new CANNON.Vec3(0, 4, 0.5),
    });
    world.addBody(wallFront);
    
    pinPositions.forEach(({ x, y }) => {
      const pinBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Sphere(PIN_RADIUS),
        position: new CANNON.Vec3(x, y, 0),
      });
      world.addBody(pinBody);
    });
    
    worldRef.current = world;
    
    return () => {
      ballsRef.current.forEach((ball) => {
        ball.geometry.dispose();
        ball.material.dispose();
      });
      ballsRef.current = [];
    };
  }, [pinPositions]);
  
  const createBall = useCallback(() => {
    if (!worldRef.current || !sceneRef.current) return;
    
    const id = `ball_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hue = Math.random() * 360;
    const color = new THREE.Color(`hsl(${hue}, 80%, 50%)`);
    
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const startX = (Math.random() - 0.5) * 2;
    mesh.position.set(startX, 10, 0);
    sceneRef.current.add(mesh);
    
    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(BALL_RADIUS),
      position: new CANNON.Vec3(startX, 10, 0),
      linearDamping: 0.1,
      angularDamping: 0.3,
    });
    
    body.velocity.set(
      (Math.random() - 0.5) * 2,
      0,
      0
    );
    
    worldRef.current.addBody(body);
    
    ballsRef.current.push({ id, mesh, body, geometry, material });
    console.log(`Ball created: ${id}`);
  }, []);
  
  const handleDropBall = useCallback(() => {
    const success = dropBall();
    if (success) {
      createBall();
    }
  }, [dropBall, createBall]);
  
  useFrame((_, delta) => {
    if (!worldRef.current || !sceneRef.current) return;
    
    const now = Date.now();
    if (autoDrop && now - lastDropTimeRef.current > 500) {
      if (money >= betAmount && activeBalls < 15) {
        handleDropBall();
        lastDropTimeRef.current = now;
      }
    }
    
    worldRef.current.step(1 / 60, delta, 3);
    
    for (let i = ballsRef.current.length - 1; i >= 0; i--) {
      const ball = ballsRef.current[i];
      
      ball.mesh.position.copy(ball.body.position as unknown as THREE.Vector3);
      ball.mesh.quaternion.copy(ball.body.quaternion as unknown as THREE.Quaternion);
      
      if (ball.body.position.y < 0.5) {
        const x = ball.body.position.x;
        
        const slotWidth = BOARD_WIDTH / NUM_SLOTS;
        let slotIndex = Math.floor((x + BOARD_WIDTH / 2) / slotWidth);
        slotIndex = Math.max(0, Math.min(NUM_SLOTS - 1, slotIndex));
        
        const multiplier = SLOT_MULTIPLIERS[slotIndex];
        const isJackpot = slotIndex === NUM_SLOTS - 1;
        
        addWin(multiplier, isJackpot);
        removeBall();
        
        sceneRef.current.remove(ball.mesh);
        worldRef.current?.removeBody(ball.body);
        ball.geometry.dispose();
        ball.material.dispose();
        
        ballsRef.current.splice(i, 1);
        console.log(`Ball ${ball.id} landed in slot ${slotIndex}, multiplier: ${multiplier}x`);
      }
    }
  });
  
  const [subscribeKeys] = useKeyboardControls();
  
  useEffect(() => {
    const unsubscribe = subscribeKeys(
      (state: any) => state.drop,
      (pressed: boolean) => {
        if (pressed) {
          console.log("Space key pressed - dropping ball");
          handleDropBall();
        }
      }
    );
    
    return () => unsubscribe();
  }, [subscribeKeys, handleDropBall]);
  
  const slotColors = ["#ff4444", "#ff8844", "#44ff44", "#44aaff", "#ffdd00"];
  
  return (
    <group ref={sceneRef}>
      {/* Tabuleiro de fundo com moldura dourada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#1a0a05" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Backboard */}
      <mesh position={[0, 4, -0.4]} receiveShadow>
        <boxGeometry args={[13, 11, 0.3]} />
        <meshStandardMaterial color="#2a1508" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* Moldura dourada */}
      <mesh position={[-BOARD_WIDTH / 2 - 0.3, 4, 0]}>
        <boxGeometry args={[0.4, 11, 1.2]} />
        <meshStandardMaterial color="#d4a537" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[BOARD_WIDTH / 2 + 0.3, 4, 0]}>
        <boxGeometry args={[0.4, 11, 1.2]} />
        <meshStandardMaterial color="#d4a537" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 9.5, 0]}>
        <boxGeometry args={[13, 0.4, 1.2]} />
        <meshStandardMaterial color="#d4a537" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[13, 0.4, 1.2]} />
        <meshStandardMaterial color="#d4a537" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Pinos dourados brilhantes */}
      {pinPositions.map((pos, index) => (
        <mesh key={index} position={[pos.x, pos.y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[PIN_RADIUS, PIN_RADIUS * 0.8, PIN_HEIGHT, 16]} />
          <meshStandardMaterial 
            color="#ffd700" 
            metalness={0.9}
            roughness={0.1}
            emissive="#ff9900"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
      
      {/* Slots coloridos na base */}
      {Array.from({ length: NUM_SLOTS }).map((_, i) => {
        const slotWidth = BOARD_WIDTH / NUM_SLOTS;
        const x = -BOARD_WIDTH / 2 + slotWidth / 2 + i * slotWidth;
        return (
          <group key={`slot_${i}`}>
            <mesh position={[x, 0, 0.1]}>
              <boxGeometry args={[slotWidth - 0.15, 0.8, 0.6]} />
              <meshStandardMaterial 
                color={slotColors[i]} 
                metalness={0.4}
                roughness={0.3}
                emissive={slotColors[i]}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Divisores entre slots */}
      {Array.from({ length: NUM_SLOTS + 1 }).map((_, i) => {
        const x = -BOARD_WIDTH / 2 + i * (BOARD_WIDTH / NUM_SLOTS);
        return (
          <mesh key={`divider_${i}`} position={[x, 0.25, 0.2]}>
            <boxGeometry args={[0.12, 0.9, 0.7]} />
            <meshStandardMaterial color="#d4a537" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}
