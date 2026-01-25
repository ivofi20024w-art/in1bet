import { useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY || "";

interface WidgetConfigProps {
  sport?: string;
  theme?: string;
  lang?: string;
}

export function WidgetConfig({ sport = "football", theme = "IN1Bet", lang = "en" }: WidgetConfigProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="config"
          data-key="${API_KEY}"
          data-sport="${sport}"
          data-theme="${theme}"
          data-lang="${lang}"
          data-show-errors="false"
          data-target-game="modal"
          data-target-team="modal"
          data-target-player="modal"
          data-target-standings="modal"
          data-timezone="America/Sao_Paulo"
        ></api-sports-widget>
      `;
    }
  }, [sport, theme, lang]);

  return <div ref={ref} />;
}

interface GamesWidgetProps {
  sport?: string;
  league?: number;
  date?: string;
  className?: string;
}

export function GamesWidget({ sport = "football", league, date, className }: GamesWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const leagueAttr = league ? `data-league="${league}"` : '';
      const dateAttr = date ? `data-date="${date}"` : '';
      const sportAttr = sport ? `data-sport="${sport}"` : '';
      
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="games"
          ${sportAttr}
          ${leagueAttr}
          ${dateAttr}
        ></api-sports-widget>
      `;
    }
  }, [sport, league, date]);

  return <div ref={ref} className={className} />;
}

interface TeamWidgetProps {
  teamId: number;
  sport?: string;
  className?: string;
}

export function TeamWidget({ teamId, sport = "football", className }: TeamWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="team"
          data-team="${teamId}"
          data-sport="${sport}"
        ></api-sports-widget>
      `;
    }
  }, [teamId, sport]);

  return <div ref={ref} className={className} />;
}

interface PlayerWidgetProps {
  playerId: number;
  sport?: string;
  className?: string;
}

export function PlayerWidget({ playerId, sport = "football", className }: PlayerWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="player"
          data-player="${playerId}"
          data-sport="${sport}"
        ></api-sports-widget>
      `;
    }
  }, [playerId, sport]);

  return <div ref={ref} className={className} />;
}

interface StandingsWidgetProps {
  leagueId: number;
  sport?: string;
  className?: string;
}

export function StandingsWidget({ leagueId, sport = "football", className }: StandingsWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="standings"
          data-league="${leagueId}"
          data-sport="${sport}"
        ></api-sports-widget>
      `;
    }
  }, [leagueId, sport]);

  return <div ref={ref} className={className} />;
}

interface GameWidgetProps {
  gameId: number;
  sport?: string;
  className?: string;
}

export function GameWidget({ gameId, sport = "football", className }: GameWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = `
        <api-sports-widget
          data-type="game"
          data-game="${gameId}"
          data-sport="${sport}"
        ></api-sports-widget>
      `;
    }
  }, [gameId, sport]);

  return <div ref={ref} className={className} />;
}
