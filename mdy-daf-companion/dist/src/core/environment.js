export function isClaudeRemoteEnvironment(env = process.env) {
    return env.CLAUDE_CODE_REMOTE === "true";
}
export function isProbablySshEnvironment(env = process.env) {
    return Boolean(env.SSH_CONNECTION || env.SSH_CLIENT || env.CODESPACES || env.REMOTE_CONTAINERS);
}
