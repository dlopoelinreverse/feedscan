#!/usr/bin/env bun
/**
 * check-i18n-keys: verify that en.json and fr.json have the exact same key
 * structure. Catches a missing-translation regression where one locale has
 * keys the other doesn't.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EN_PATH = resolve(__dirname, "..", "src", "messages", "en.json");
const FR_PATH = resolve(__dirname, "..", "src", "messages", "fr.json");

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v, next));
    } else {
      out.push(next);
    }
  }
  return out;
}

const en = JSON.parse(readFileSync(EN_PATH, "utf8")) as Json;
const fr = JSON.parse(readFileSync(FR_PATH, "utf8")) as Json;

const enKeys = new Set(flatten(en));
const frKeys = new Set(flatten(fr));

const missingInFr = [...enKeys].filter((k) => !frKeys.has(k)).sort();
const missingInEn = [...frKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInFr.length === 0 && missingInEn.length === 0) {
  console.log(
    `✓ check-i18n-keys: en.json and fr.json are in sync (${enKeys.size} keys).`
  );
  process.exit(0);
}

if (missingInFr.length > 0) {
  console.error(`✗ Missing in fr.json (${missingInFr.length}):`);
  for (const k of missingInFr) console.error(`    ${k}`);
}
if (missingInEn.length > 0) {
  console.error(`✗ Missing in en.json (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`    ${k}`);
}

process.exit(1);
