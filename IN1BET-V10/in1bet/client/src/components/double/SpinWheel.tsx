import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { DoubleBetType } from "@shared/schema";
import { WHEEL_PATTERN, WHEEL_SIZE } from "@/lib/game-data";
import { ResultTile } from "./ResultTile";

interface SpinWheelProps {
  isSpinning: boolean;
  winningType: DoubleBetType | null;
  stopIndex: number | null;
  spinId: string | null;
  spinStartTime: number | null;
  spinDuration: number;
  onSpinComplete: () => void;
}

const TILE_WIDTH = 62;
const TILE_GAP = 10;
const TILE_TOTAL = TILE_WIDTH + TILE_GAP;

function generateCenteredSequence(centerWheelIndex: number, visibleTiles: number): DoubleBetType[] {
  const sequence: DoubleBetType[] = [];
  const halfTiles = Math.floor(visibleTiles / 2);
  
  for (let i = 0; i < visibleTiles; i++) {
    const offset = i - halfTiles;
    const wheelIndex = ((centerWheelIndex + offset) % WHEEL_SIZE + WHEEL_SIZE) % WHEEL_SIZE;
    sequence.push(WHEEL_PATTERN[wheelIndex]);
  }
  
  return sequence;
}

export function SpinWheel({ 
  isSpinning, 
  winningType, 
  stopIndex,
  spinId,
  spinStartTime,
  spinDuration,
  onSpinComplete 
}: SpinWheelProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastStopIndex, setLastStopIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const processedSpinIdRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  const visibleTileCount = useMemo(() => {
    if (containerWidth <= 0) return 5;
    return Math.max(3, Math.ceil((containerWidth + TILE_GAP) / TILE_TOTAL) + 2);
  }, [containerWidth]);
  
  const defaultSequence = useMemo(() => {
    const seq: DoubleBetType[] = [];
    for (let i = 0; i < visibleTileCount; i++) {
      seq.push(WHEEL_PATTERN[i % WHEEL_SIZE]);
    }
    return seq;
  }, [visibleTileCount]);
  
  const getTilesCenteredOn = useCallback((centerWheelIndex: number): DoubleBetType[] => {
    return generateCenteredSequence(centerWheelIndex, visibleTileCount);
  }, [visibleTileCount]);
  
  const staticWinnerSequence = useMemo(() => {
    if (lastStopIndex === null) return null;
    return generateCenteredSequence(lastStopIndex, visibleTileCount);
  }, [lastStopIndex, visibleTileCount]);
  
  const getVisibleTilesAndCenter = useCallback((position: number): { tiles: DoubleBetType[], centerIndex: number } => {
    const centerWheelIndex = ((Math.round(position) % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
    return { 
      tiles: getTilesCenteredOn(centerWheelIndex), 
      centerIndex: Math.round(position) 
    };
  }, [getTilesCenteredOn]);
  
  const startAnimation = useCallback((targetStopIndex: number, duration: number, elapsed: number) => {
    if (containerWidth <= 0) return false;
    
    const lateJoinRatio = elapsed / duration;
    const spinRevolutions = lateJoinRatio > 0.5 ? 1 : lateJoinRatio > 0.3 ? 2 : 3;
    const totalDistance = (spinRevolutions * WHEEL_SIZE) + targetStopIndex;
    
    setIsAnimating(true);
    setShowResult(false);
    setLastStopIndex(targetStopIndex);
    
    const MINIMUM_ANIMATION_TIME = 1500;
    const remainingDuration = Math.max(duration - elapsed, MINIMUM_ANIMATION_TIME);
    const startProgress = Math.min(elapsed / duration, 0.3);
    
    const initialPosition = totalDistance * (1 - Math.pow(1 - startProgress, 4));
    setScrollPosition(initialPosition);
    
    const startTime = Date.now();
    
    const animate = () => {
      const animElapsed = Date.now() - startTime;
      const normalizedProgress = animElapsed / remainingDuration;
      const totalProgress = startProgress + ((1 - startProgress) * normalizedProgress);
      const clampedProgress = Math.min(totalProgress, 1);
      
      const easeOut = 1 - Math.pow(1 - clampedProgress, 4);
      
      const currentPosition = totalDistance * easeOut;
      setScrollPosition(currentPosition);
      
      if (clampedProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setScrollPosition(totalDistance);
        setIsAnimating(false);
        setShowResult(true);
        timeoutRef.current = setTimeout(() => {
          onSpinComplete();
        }, 2000);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return true;
  }, [onSpinComplete, containerWidth]);
  
  const showStaticResult = useCallback((targetStopIndex: number) => {
    setLastStopIndex(targetStopIndex);
    setIsAnimating(false);
    setShowResult(true);
    timeoutRef.current = setTimeout(() => {
      onSpinComplete();
    }, 2000);
  }, [onSpinComplete]);
  
  useEffect(() => {
    if (isSpinning && stopIndex !== null && spinId && spinStartTime) {
      if (processedSpinIdRef.current === spinId) {
        return;
      }
      
      const elapsed = Date.now() - spinStartTime;
      const MINIMUM_ANIMATION_TIME = 1500;
      
      if (elapsed >= spinDuration + MINIMUM_ANIMATION_TIME) {
        processedSpinIdRef.current = spinId;
        showStaticResult(stopIndex);
        return;
      }
      
      if (containerWidth > 0) {
        processedSpinIdRef.current = spinId;
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        const adjustedElapsed = Math.min(elapsed, spinDuration - MINIMUM_ANIMATION_TIME);
        const started = startAnimation(stopIndex, spinDuration, Math.max(0, adjustedElapsed));
        if (!started) {
          showStaticResult(stopIndex);
        }
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSpinning, stopIndex, spinId, spinStartTime, spinDuration, startAnimation, showStaticResult, containerWidth]);
  
  useEffect(() => {
    if (!isSpinning && !showResult && !isAnimating) {
      setScrollPosition(0);
      setLastStopIndex(null);
      processedSpinIdRef.current = null;
    }
  }, [isSpinning, showResult, isAnimating]);
  
  const shouldShowAnimation = isAnimating;
  const shouldShowStaticWinner = !isAnimating && showResult && staticWinnerSequence;
  
  let displayTiles: DoubleBetType[];
  let fractionalOffset = 0;
  
  if (shouldShowAnimation) {
    const { tiles, centerIndex } = getVisibleTilesAndCenter(scrollPosition);
    displayTiles = tiles;
    fractionalOffset = (scrollPosition - centerIndex) * TILE_TOTAL;
  } else if (shouldShowStaticWinner) {
    displayTiles = staticWinnerSequence;
    fractionalOffset = 0;
  } else {
    displayTiles = defaultSequence;
    fractionalOffset = 0;
  }
  
  const centerTileIndex = Math.floor(displayTiles.length / 2);
  const centerOfCenterTile = centerTileIndex * TILE_TOTAL + TILE_WIDTH / 2;
  const baseOffset = containerWidth / 2 - centerOfCenterTile;
  const translateX = baseOffset - fractionalOffset;
  
  const lastWinner = lastStopIndex !== null ? WHEEL_PATTERN[lastStopIndex] : null;
  
  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-lg overflow-hidden p-4" data-testid="spin-wheel">
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-black/20 border border-white/10 w-full"
        style={{ minHeight: '96px' }}
      >
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-20 pointer-events-none bg-white/80"
        />
        
        <div 
          className="flex py-4"
          style={{
            gap: `${TILE_GAP}px`,
            transform: `translateX(${translateX}px)`,
            width: 'max-content',
          }}
        >
          {displayTiles.map((type, index) => {
            const isCenterTile = index === Math.floor(displayTiles.length / 2);
            return (
              <div 
                key={`tile-${index}-${type}`}
                className="flex-shrink-0"
                data-testid={isCenterTile ? `center-tile-${type}` : undefined}
                data-center={isCenterTile ? "true" : undefined}
              >
                <ResultTile type={type} />
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
