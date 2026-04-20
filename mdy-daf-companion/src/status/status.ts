import { resolveRuntimePaths } from "../core/paths.js";
import { readDaemonStatus } from "../daemon/client.js";
import { withDatabase } from "../storage/database.js";

export interface StatusSummary {
  ok: boolean;
  hookEvents: number;
  latestEvent: string | null;
  latestAction: string | null;
  message: string;
}

export function getStatusSummary(): StatusSummary {
  const paths = resolveRuntimePaths();

  return withDatabase(paths, (database) => {
    const hookEvents = database.getHookEventCount();
    const latest = database.getLatestHookEvent();
    return {
      ok: true,
      hookEvents,
      latestEvent: latest?.eventName || null,
      latestAction: latest?.actionTaken || null,
      message:
        hookEvents === 0
          ? "MDY Daf Companion is initialized. No Claude hook events recorded yet."
          : `MDY Daf Companion is initialized. Recorded ${hookEvents} hook event(s).`
    };
  });
}

export function formatStatus(summary: StatusSummary): string {
  if (!summary.ok) {
    return "MDY Daf Companion unavailable";
  }

  const latest = summary.latestEvent ? ` Latest: ${summary.latestEvent}/${summary.latestAction}.` : "";
  return `${summary.message}${latest}`;
}

export async function getLiveStatusText(): Promise<string> {
  const paths = resolveRuntimePaths();
  try {
    const status = (await readDaemonStatus(paths)) as {
      playbackState?: string;
      hookEvents?: number;
      lastAction?: string | null;
    };
    return `MDY Daf Companion daemon ${status.playbackState || "ready"}; ${status.hookEvents || 0} hook event(s); last action ${status.lastAction || "none"}.`;
  } catch {
    return formatStatus(getStatusSummary());
  }
}
