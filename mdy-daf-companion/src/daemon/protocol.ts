export interface DaemonStatus {
  ok: true;
  pid: number;
  startedAt: string;
  playbackState: PlaybackState;
  lastAction: string | null;
  hookEvents: number;
}

export type PlaybackState = "idle" | "playing" | "paused" | "blocked";

export interface DaemonActionResult {
  ok: true;
  action: string;
  playbackState: PlaybackState;
}

export interface DaemonError {
  ok: false;
  error: string;
}

export type DaemonResponse = DaemonStatus | DaemonActionResult | DaemonError;

