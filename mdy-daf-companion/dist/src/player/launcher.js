import { spawn } from "node:child_process";
export function getOpenCommand(url, platform = process.platform) {
    if (platform === "win32") {
        return { command: "cmd", args: ["/c", "start", "", url] };
    }
    if (platform === "darwin") {
        return { command: "open", args: [url] };
    }
    return { command: "xdg-open", args: [url] };
}
export function openUrl(url) {
    const { command, args } = getOpenCommand(url);
    const child = spawn(command, args, {
        detached: true,
        stdio: "ignore",
        shell: false
    });
    child.unref();
}
