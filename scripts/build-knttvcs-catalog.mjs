#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "kntt.json");
const outputPath = path.join(repoRoot, "js", "catalog", "books", "knttvcs.json");
const topicLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function toSetId(grade, topicLetter) {
	return `knttvcs-lop-${grade}-${topicLetter}-v1`;
}

function toQuestionFile(grade, topicLetter, setId) {
	return `js/question-sets/knttvcs/lop-${grade}/${topicLetter}/${setId}.json`;
}

function getTopicStableKey(topic) {
	return topic.code || String(topic.id) || topic.slug || topic.name;
}

function buildTopicLetterMap(topics) {
	const slugToLetter = new Map();
	let letterIndex = 0;

	for (const topic of topics) {
		const stableKey = getTopicStableKey(topic);
		if (slugToLetter.has(stableKey)) {
			continue;
		}

		const topicLetter = topicLetters[letterIndex];
		if (!topicLetter) {
			throw new Error(
				`Grade has more than ${topicLetters.length} topic groups. Cannot map ${stableKey}.`,
			);
		}

		slugToLetter.set(stableKey, topicLetter);
		letterIndex += 1;
	}

	return slugToLetter;
}

const catalog = {
	bookCode: "KNTTVCS",
	bookTitle: "Kết nối tri thức với cuộc sống",
	grades: (source.grades || []).map((gradeEntry) => {
		const topicLetterMap = buildTopicLetterMap(gradeEntry.topics || []);

		return {
			grade: gradeEntry.grade,
			code: gradeEntry.code,
			slug: gradeEntry.slug,
			topics: (gradeEntry.topics || []).map((topic) => {
				const stableKey = getTopicStableKey(topic);
				const topicLetter = topicLetterMap.get(stableKey);
				const part = Number.isInteger(topic.part) ? topic.part : 1;
				const setId = toSetId(gradeEntry.grade, topicLetter);
				const questionFile = toQuestionFile(gradeEntry.grade, topicLetter, setId);
				const absoluteQuestionFile = path.join(repoRoot, questionFile);

				return {
					id: topic.id,
					code: topic.code,
					topicLetter,
					part,
					topicName: topic.name,
					topicSlug: topic.slug,
					setId,
					questionFile,
					version: "v1",
					enabled: fs.existsSync(absoluteQuestionFile),
				};
			}),
		};
	}),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(`Built ${path.relative(repoRoot, outputPath)} from ${path.relative(repoRoot, sourcePath)}`);
