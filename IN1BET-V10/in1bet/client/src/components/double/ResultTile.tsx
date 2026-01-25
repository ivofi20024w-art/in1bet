import type { DoubleBetType } from "@shared/schema";
import { Dices, Rotate3D, Crown } from "lucide-react";

interface ResultTileProps {
  type: DoubleBetType;
  size?: "normal" | "small";
}

export function ResultTile({ type, size = "normal" }: ResultTileProps) {
  const isSmall = size === "small";
  const outerSize = isSmall ? "w-[38px] h-[38px]" : "w-[62px] h-[62px]";
  const innerSize = isSmall ? "w-[30px] h-[30px]" : "w-[52px] h-[52px]";
  const iconSize = isSmall ? "w-3.5 h-3.5" : "w-[22px] h-[22px]";
  
  const Icon = type === "red" || type === "black" ? Dices : 
               type === "green" ? Rotate3D : Crown;
  
  const bgColorClass = type === "red" ? "bg-red-500" :
                       type === "green" ? "bg-green-500" :
                       type === "crown" ? "bg-yellow-500" : "bg-zinc-800";
  
  return (
    <div 
      className={`${outerSize} rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center`}
      data-testid={`tile-${type}`}
    >
      <div 
        className={`${innerSize} rounded-[10px] border border-white/10 flex items-center justify-center ${bgColorClass}`}
      >
        <Icon 
          className={`${iconSize} opacity-90`}
          style={{ color: type === "crown" ? "rgba(0,0,0,.75)" : "white" }}
        />
      </div>
    </div>
  );
}
