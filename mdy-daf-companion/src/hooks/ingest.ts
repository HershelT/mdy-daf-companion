import { resolveRuntimePaths } from "../core/paths.js";
import { withDatabase } from "../storage/database.js";
import { parseHookPayload, toHookEventRecord } from "./events.js";

export interface IngestResult {
  id: string;
  eventName: string;
  actionTaken: string | null;
  parseError: string | null;
}

export function ingestHookEvent(stdin: string, fallbackEventName: string): IngestResult {
  const paths = resolveRuntimePaths();
  const { payload, error } = parseHookPayload(stdin);
  const record = toHookEventRecord(payload, fallbackEventName, error);

  return withDatabase(paths, (database) => {
    const id = database.insertHookEvent(record);
    return {
      id,
      eventName: record.eventName,
      actionTaken: record.actionTaken,
      parseError: error
    };
  });
}

