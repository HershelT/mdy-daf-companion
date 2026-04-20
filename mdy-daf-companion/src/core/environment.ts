export function isClaudeRemoteEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CLAUDE_CODE_REMOTE === "true";
}

export function isProbablySshEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.SSH_CONNECTION || env.SSH_CLIENT || env.CODESPACES || env.REMOTE_CONTAINERS);
}

