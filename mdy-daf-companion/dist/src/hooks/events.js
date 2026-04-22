import { stableHash } from "../core/hash.js";
import { nowIso } from "../core/time.js";
export function parseHookPayload(stdin) {
    if (!stdin.trim()) {
        return { payload: {}, error: null };
    }
    try {
        const parsed = JSON.parse(stdin);
        return { payload: parsed, error: null };
    }
    catch (error) {
        return {
            payload: {},
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
export function actionForHookEvent(eventName, notificationType) {
    switch (eventName) {
        case "SessionStart":
            return "prepare";
        case "UserPromptSubmit":
            return "resume";
        case "Notification":
            return notificationType === "permission_prompt" ||
                notificationType === "idle_prompt" ||
                notificationType === "elicitation_dialog"
                ? "pause_waiting"
                : "record_only";
        case "Stop":
            return "pause_done";
        case "StopFailure":
            return "pause_error";
        case "PreCompact":
        case "PostCompact":
            return "flush";
        case "SessionEnd":
            return "close";
        default:
            return "record_only";
    }
}
export function toHookEventRecord(payload, fallbackEventName, parseError, receivedAt = nowIso()) {
    const eventName = payload.hook_event_name || fallbackEventName;
    const notificationType = typeof payload.notification_type === "string" ? payload.notification_type : undefined;
    return {
        claudeSessionId: typeof payload.session_id === "string" ? payload.session_id : null,
        eventName,
        matcher: typeof payload.matcher === "string" ? payload.matcher : notificationType || null,
        receivedAt,
        actionTaken: actionForHookEvent(eventName, notificationType),
        payloadHash: stableHash(JSON.stringify({ eventName, notificationType: notificationType || null })),
        error: parseError
    };
}
