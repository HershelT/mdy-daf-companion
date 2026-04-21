#!/usr/bin/env node
import { ingestHookEvent } from "./hooks/ingest.js";
import { ingestHookEventViaDaemon } from "./hooks/ingest.js";
import { resolveRuntimePaths } from "./core/paths.js";
import { getCompanionPlayerUrl, getDashboardUrl, resolveCurrentShiur, sendDaemonAction, startDaemonProcess } from "./daemon/client.js";
import { runDaemon } from "./daemon/server.js";
import { formatDoctorReport, runDoctor } from "./doctor/doctor.js";
import { openCompanionPlayer } from "./player/companionLauncher.js";
import { HebcalDafCalendar } from "./resolver/dafCalendar.js";
import { createDefaultCandidateProvider } from "./resolver/defaultProvider.js";
import { chooseBestCandidate } from "./resolver/scoring.js";
import { applySetupOptions, formatSetupSummary } from "./settings/setup.js";
import { formatStatsSummary, getTodayStatsSummary } from "./stats/summary.js";
import { getLiveStatusText } from "./status/status.js";
async function readStdin() {
    let input = "";
    process.stdin.setEncoding("utf8");
    for await (const chunk of process.stdin) {
        input += chunk;
    }
    return input;
}
function argValue(name, fallback) {
    const index = process.argv.indexOf(name);
    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
async function main() {
    const command = process.argv[2] || "status";
    switch (command) {
        case "hook": {
            const fallbackEventName = argValue("--event", "Unknown");
            const stdin = await readStdin();
            const direct = process.argv.includes("--direct");
            const result = direct
                ? ingestHookEvent(stdin, fallbackEventName)
                : await ingestHookEventViaDaemon(stdin, fallbackEventName);
            if (typeof result === "object" &&
                result &&
                "parseError" in result &&
                typeof result.parseError === "string") {
                console.error(`Recorded hook with parse error: ${result.parseError}`);
            }
            process.stdout.write(`${JSON.stringify(result)}\n`);
            return;
        }
        case "status": {
            process.stdout.write(`${await getLiveStatusText()}\n`);
            return;
        }
        case "daemon": {
            await runDaemon(resolveRuntimePaths());
            return;
        }
        case "start-daemon": {
            await startDaemonProcess(resolveRuntimePaths());
            process.stdout.write("Daemon start requested.\n");
            return;
        }
        case "setup": {
            const config = applySetupOptions(process.argv.slice(3));
            process.stdout.write(`${formatSetupSummary(config)}\n`);
            return;
        }
        case "play":
        case "pause":
        case "resume": {
            const result = await sendDaemonAction(resolveRuntimePaths(), command);
            process.stdout.write(`${JSON.stringify(result)}\n`);
            return;
        }
        case "today": {
            const date = argValue("--date", new Date().toISOString().slice(0, 10));
            const daf = await new HebcalDafCalendar().getDafForDate(date);
            process.stdout.write(`${daf.date}: ${daf.masechta} ${daf.daf}\n`);
            return;
        }
        case "resolve": {
            const date = argValue("--date", new Date().toISOString().slice(0, 10));
            const daf = await new HebcalDafCalendar().getDafForDate(date);
            const candidates = await createDefaultCandidateProvider(resolveRuntimePaths()).getCandidates(daf);
            const resolved = chooseBestCandidate(daf, candidates, {
                language: "english",
                format: "full"
            });
            process.stdout.write(`${resolved.daf.date}: ${resolved.daf.masechta} ${resolved.daf.daf} -> ${resolved.video.title} (${resolved.video.url}) confidence ${resolved.confidence}\n`);
            return;
        }
        case "prepare": {
            await startDaemonProcess(resolveRuntimePaths());
            const date = process.argv.includes("--date") ? argValue("--date", "") : undefined;
            const result = await resolveCurrentShiur(resolveRuntimePaths(), date);
            process.stdout.write(`${JSON.stringify(result)}\n`);
            return;
        }
        case "companion-url": {
            await startDaemonProcess(resolveRuntimePaths());
            process.stdout.write(`${await getCompanionPlayerUrl(resolveRuntimePaths())}\n`);
            return;
        }
        case "dashboard-url": {
            await startDaemonProcess(resolveRuntimePaths());
            process.stdout.write(`${await getDashboardUrl(resolveRuntimePaths())}\n`);
            return;
        }
        case "open-player": {
            const paths = resolveRuntimePaths();
            await startDaemonProcess(paths);
            const url = await getCompanionPlayerUrl(paths);
            const result = openCompanionPlayer(paths, url);
            process.stdout.write(`${JSON.stringify({ ok: result.opened, url, ...result })}\n`);
            return;
        }
        case "open-companion": {
            const paths = resolveRuntimePaths();
            await startDaemonProcess(paths);
            const url = await getCompanionPlayerUrl(paths);
            const result = openCompanionPlayer(paths, url);
            process.stdout.write(`${JSON.stringify({ ok: result.opened, url, ...result })}\n`);
            return;
        }
        case "open-dashboard": {
            const paths = resolveRuntimePaths();
            await startDaemonProcess(paths);
            const url = `${await getCompanionPlayerUrl(paths)}#stats`;
            const result = openCompanionPlayer(paths, url);
            process.stdout.write(`${JSON.stringify({ ok: result.opened, url, ...result })}\n`);
            return;
        }
        case "stats": {
            process.stdout.write(`${formatStatsSummary(getTodayStatsSummary())}\n`);
            return;
        }
        case "doctor": {
            const report = runDoctor();
            process.stdout.write(`${formatDoctorReport(report)}\n`);
            process.exitCode = report.ok ? 0 : 1;
            return;
        }
        default:
            console.error(`Unknown command: ${command}`);
            process.exitCode = 1;
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
