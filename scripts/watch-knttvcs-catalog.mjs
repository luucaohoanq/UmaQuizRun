#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "kntt.json");
const questionSetRoot = path.join(repoRoot, "js", "question-sets", "knttvcs");
const buildScriptPath = path.join(__dirname, "build-knttvcs-catalog.mjs");
const pollIntervalMs = 1000;

function walkJsonFiles(dirPath) {
	const entries = fs.existsSync(dirPath)
		? fs.readdirSync(dirPath, { withFileTypes: true })
		: [];

	return entries.flatMap((entry) => {
		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			return walkJsonFiles(entryPath);
		}
		if (entry.isFile() && entry.name.endsWith(".json")) {
			return [entryPath];
		}
		return [];
	});
}

function buildSnapshot() {
	const trackedFiles = [sourcePath, ...walkJsonFiles(questionSetRoot)].filter((filePath) =>
		fs.existsSync(filePath),
	);

	return trackedFiles
		.map((filePath) => {
			const stats = fs.statSync(filePath);
			return `${path.relative(repoRoot, filePath)}:${stats.size}:${stats.mtimeMs}`;
		})
		.sort()
		.join("|");
}

function runBuild(triggerLabel) {
	const timestamp = new Date().toLocaleTimeString("vi-VN");
	console.log(`[${timestamp}] Change detected (${triggerLabel}). Rebuilding catalog...`);

	const result = spawnSync(process.execPath, [buildScriptPath], {
		cwd: repoRoot,
		stdio: "inherit",
	});

	if (result.status !== 0) {
		console.error(`[${timestamp}] Build failed.`);
	} else {
		console.log(`[${timestamp}] Catalog rebuild complete.`);
	}
}

let previousSnapshot = buildSnapshot();

runBuild("initial");
console.log(`Watching ${path.relative(repoRoot, sourcePath)} and ${path.relative(repoRoot, questionSetRoot)} ...`);

setInterval(() => {
	try {
		const nextSnapshot = buildSnapshot();
		if (nextSnapshot !== previousSnapshot) {
			previousSnapshot = nextSnapshot;
			runBuild("json update");
		}
	} catch (error) {
		console.error("Watch cycle failed:", error);
	}
}, pollIntervalMs);
