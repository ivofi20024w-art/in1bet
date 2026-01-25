import { usePlinko } from "@/lib/stores/usePlinko";
import { useEffect, useState } from "react";

export function BigWinEffect() {
  const { showBigWin, lastWin } = usePlinko();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  
  useEffect(() => {
    if (showBigWin) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [showBigWin]);
  
  if (!showBigWin) return null;
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '35%',
        width: '100%',
        textAlign: 'center',
        zIndex: 200,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: '72px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: 'gold',
          textShadow: '0 0 30px orange, 0 0 60px #ff6600, 0 0 90px #ff3300',
          animation: 'bigWinPulse 0.3s ease-in-out infinite alternate',
        }}>
          JACKPOT!!!
        </div>
        <div style={{
          fontSize: '48px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          color: '#90EE90',
          textShadow: '0 0 20px #00ff00',
          marginTop: '10px',
        }}>
          +{lastWin}
        </div>
      </div>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'fixed',
            left: `${particle.x}%`,
            top: '-20px',
            width: '10px',
            height: '10px',
            background: 'gold',
            borderRadius: '50%',
            boxShadow: '0 0 10px gold',
            animation: `particleFall 2s ${particle.delay}s ease-in forwards`,
            zIndex: 150,
            pointerEvents: 'none',
          }}
        />
      ))}
      
      <style>{`
        @keyframes bigWinPulse {
          from { 
            text-shadow: 0 0 30px orange, 0 0 60px #ff6600, 0 0 90px #ff3300;
          }
          to { 
            text-shadow: 0 0 50px orange, 0 0 80px #ff6600, 0 0 120px #ff3300;
          }
        }
        
        @keyframes particleFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
