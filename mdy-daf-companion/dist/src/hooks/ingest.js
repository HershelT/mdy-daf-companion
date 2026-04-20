import { resolveRuntimePaths } from "../core/paths.js";
import { sendHookToDaemon, startDaemonProcess } from "../daemon/client.js";
import { withDatabase } from "../storage/database.js";
import { parseHookPayload, toHookEventRecord } from "./events.js";
export function ingestHookEvent(stdin, fallbackEventName) {
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
export async function ingestHookEventViaDaemon(stdin, fallbackEventName) {
    const paths = resolveRuntimePaths();
    try {
        await startDaemonProcess(paths);
        return await sendHookToDaemon(paths, fallbackEventName, stdin);
    }
    catch {
        return ingestHookEvent(stdin, fallbackEventName);
    }
}
