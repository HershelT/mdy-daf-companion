import assert from "node:assert/strict";
import test from "node:test";
import { actionForHookEvent, parseHookPayload, toHookEventRecord } from "../src/hooks/events.js";

test("parseHookPayload parses valid JSON", () => {
  const { payload, error } = parseHookPayload('{"hook_event_name":"Stop","session_id":"abc"}');
  assert.equal(error, null);
  assert.equal(payload.hook_event_name, "Stop");
});

test("parseHookPayload reports invalid JSON without throwing", () => {
  const { payload, error } = parseHookPayload("{bad json");
  assert.deepEqual(payload, {});
  assert.match(error || "", /JSON/);
});

test("actionForHookEvent maps lifecycle events to playback actions", () => {
  assert.equal(actionForHookEvent("SessionStart"), "prepare");
  assert.equal(actionForHookEvent("UserPromptSubmit"), "resume");
  assert.equal(actionForHookEvent("Stop"), "pause_done");
  assert.equal(actionForHookEvent("StopFailure"), "pause_error");
  assert.equal(actionForHookEvent("SessionEnd"), "close");
});

test("notification permission prompt pauses as waiting", () => {
  assert.equal(actionForHookEvent("Notification", "permission_prompt"), "pause_waiting");
  assert.equal(actionForHookEvent("Notification", "auth_success"), "record_only");
});

test("toHookEventRecord fingerprints event category and keeps session id", () => {
  const record = toHookEventRecord(
    { hook_event_name: "Stop", session_id: "session-1" },
    "Fallback",
    null,
    "2026-04-19T00:00:00.000Z"
  );
  assert.equal(record.claudeSessionId, "session-1");
  assert.equal(record.eventName, "Stop");
  assert.equal(record.actionTaken, "pause_done");
  assert.equal(record.payloadHash?.length, 64);
});

test("toHookEventRecord fingerprint excludes raw prompt and tool content", () => {
  const first = toHookEventRecord(
    {
      hook_event_name: "UserPromptSubmit",
      session_id: "session-1",
      prompt: "private prompt text",
      tool_input: { file_path: "C:/private/project/file.ts" }
    },
    "Fallback",
    null,
    "2026-04-19T00:00:00.000Z"
  );
  const second = toHookEventRecord(
    {
      hook_event_name: "UserPromptSubmit",
      session_id: "session-1",
      prompt: "different private prompt text",
      tool_input: { file_path: "C:/other/private/file.ts" }
    },
    "Fallback",
    null,
    "2026-04-19T00:00:00.000Z"
  );

  assert.equal(first.payloadHash, second.payloadHash);
});
