import assert from "node:assert/strict";
import test from "node:test";
import { isClaudeRemoteEnvironment, isProbablySshEnvironment } from "../src/core/environment.js";

test("isClaudeRemoteEnvironment detects Claude cloud sessions", () => {
  assert.equal(isClaudeRemoteEnvironment({ CLAUDE_CODE_REMOTE: "true" }), true);
  assert.equal(isClaudeRemoteEnvironment({}), false);
});

test("isProbablySshEnvironment detects common remote shells", () => {
  assert.equal(isProbablySshEnvironment({ SSH_CONNECTION: "host" }), true);
  assert.equal(isProbablySshEnvironment({ CODESPACES: "true" }), true);
  assert.equal(isProbablySshEnvironment({}), false);
});

