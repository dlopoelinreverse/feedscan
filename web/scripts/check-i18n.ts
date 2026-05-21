#!/usr/bin/env bun
/**
 * check-i18n: static scanner that detects hardcoded UI strings under web/src,
 * meant to be run in CI to prevent regressions of i18n coverage.
 *
 * Detected patterns:
 *   - JSX text content between tags  (e.g. >Some text<)
 *   - Known UI props with string literals (placeholder, title, aria-label, …)
 *   - toast() / toast.success() / toast.error() with literal strings
 *
 * Run:
 *   bun web/scripts/check-i18n.ts            # scans web/src
 *   bun web/scripts/check-i18n.ts --quiet    # only prints summary
 *
 * Exit code: 0 if clean, 1 if any finding.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "src");
const QUIET = process.argv.includes("--quiet");

// ─── exclusions ────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(["messages", "i18n", "node_modules", ".next"]);
const SKIP_FILES = new Set([
  "proxy.ts",
  // Bilingual preview constants: these strings render the END FORM's preview
  // in FR or EN depending on a separate previewLocale prop, NOT the UI locale.
  // They are intentional content, not UI labels.
  "mobile-preview.tsx",
]);
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

// ─── UI props that take user-facing text ───────────────────────────────────
const UI_PROPS = [
  "placeholder",
  "title",
  "label",
  "description",
  "alt",
  "aria-label",
  "submitText",
  "confirmText",
  "cancelText",
  "tooltip",
  "emptyMessage",
  "currentLabel",
  "previousLabel",
  "topReasonsLabel",
  "errorMessage",
];

// ─── allowlist (technical strings that are not UI text) ────────────────────
const ALLOW_VALUE_PATTERNS: RegExp[] = [
  /^https?:\/\//,
  /^mailto:/,
  /^\//, // route paths
  /^[a-z][a-zA-Z0-9_-]*$/, // identifier-like
  /^[A-Z][A-Z0-9_]+$/, // ENUM-LIKE
  /^application\//, // mime
  /^[\d.,\s%/+-]+$/, // numeric only
  /^[•·★☆—…]+$/, // decorations
];

interface Finding {
  file: string;
  line: number;
  kind: "prop" | "jsx-text" | "toast";
  detail: string;
  value: string;
}

function isUIString(s: string): boolean {
  if (s.length < 3) return false;
  if (!/^[A-Za-zÀ-ÿ]/.test(s)) return false;
  for (const p of ALLOW_VALUE_PATTERNS) {
    if (p.test(s)) return false;
  }
  // Identifier or single short word → skip.
  if (/^[a-z][a-zA-Z0-9_]*$/.test(s)) return false;
  // PascalCase identifier single word.
  if (/^[A-Z][a-z]{0,3}$/.test(s)) return false;
  // Must look like prose: contain a space, an accented char, or end in punctuation.
  if (
    !/\s/.test(s) &&
    !/[àâçéèêëîïôûùüÿñÀÂÇÉÈÊËÎÏÔÛÙÜŸÑ]/.test(s) &&
    !/[.!?]$/.test(s)
  ) {
    // Single capitalized word ≥ 5 chars — likely a UI label
    if (!/^[A-Z][a-z]{4,}$/.test(s)) return false;
  }
  return true;
}

function lineOf(content: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx; i++) if (content.charCodeAt(i) === 10) line++;
  return line;
}

function scanFile(absPath: string, content: string): Finding[] {
  const rel = relative(ROOT, absPath);
  const findings: Finding[] = [];

  // 1. UI props with string literal values
  const propRe = new RegExp(
    String.raw`\b(${UI_PROPS.join("|")})\s*=\s*"([^"\\\n]{2,})"`,
    "g"
  );
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(content))) {
    const [, prop, value] = m;
    if (!isUIString(value)) continue;
    findings.push({
      file: rel,
      line: lineOf(content, m.index),
      kind: "prop",
      detail: prop,
      value,
    });
  }

  // 2. JSX text content — but skip TS generic noise.
  // We look for `>X<` patterns. To filter out things like `Promise<void>` and
  // `Record<typeof X>`, we require that the leading `>` is NOT preceded by a
  // TS-arrow `=` or a type-name char that suggests a generic boundary.
  const textRe = /([^=:\/<])>([^<>{}\n]{4,200})</g;
  while ((m = textRe.exec(content))) {
    const text = m[2].trim();
    if (!text) continue;
    if (!isUIString(text)) continue;
    // skip code-looking
    if (/=>|&&|\|\||\?\?|===|!==/.test(text)) continue;
    // skip pure TS-type-name single words (Promise, Array, Record, ...)
    if (/^(Promise|Array|Record|Map|Set|Partial|Required|Pick|Omit|ReadonlyArray|Readonly|ReturnType|Parameters|Awaited|InstanceType|NonNullable|Exclude|Extract|ComponentProps|ComponentPropsWithoutRef|ElementRef|RefObject|MutableRefObject|HTMLAttributes|CSSProperties|PropsWithChildren)$/.test(
        text
      )) continue;
    findings.push({
      file: rel,
      line: lineOf(content, m.index) + (m[1] === "\n" ? 1 : 0),
      kind: "jsx-text",
      detail: "",
      value: text,
    });
  }

  // 3. toast() / toast.method() with literal
  const toastRe = /toast(?:\.(?:success|error|info|warning))?\s*\(\s*"([^"\\\n]{3,})"/g;
  while ((m = toastRe.exec(content))) {
    const value = m[1];
    if (!isUIString(value)) continue;
    findings.push({
      file: rel,
      line: lineOf(content, m.index),
      kind: "toast",
      detail: "",
      value,
    });
  }

  return findings;
}

function walk(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, acc);
      continue;
    }
    if (!st.isFile()) continue;
    if (!/\.(tsx?|jsx?)$/.test(entry)) continue;
    if (SKIP_FILES.has(entry)) continue;
    if (TEST_FILE.test(entry)) continue;
    acc.push(full);
  }
}

function main(): number {
  const files: string[] = [];
  walk(ROOT, files);

  const findings: Finding[] = [];
  for (const f of files) {
    let c: string;
    try {
      c = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    findings.push(...scanFile(f, c));
  }

  if (findings.length === 0) {
    if (!QUIET) console.log("✓ check-i18n: no hardcoded UI strings detected.");
    return 0;
  }

  // Group by file for readable output
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) {
    const arr = byFile.get(f.file) ?? [];
    arr.push(f);
    byFile.set(f.file, arr);
  }

  console.error(`✗ check-i18n: ${findings.length} hardcoded string(s) found.\n`);
  for (const [file, items] of [...byFile.entries()].sort()) {
    console.error(`  ${file}`);
    for (const it of items.sort((a, b) => a.line - b.line)) {
      const tag = it.kind === "prop" ? `prop:${it.detail}` : it.kind;
      const snippet =
        it.value.length > 80 ? it.value.slice(0, 77) + "..." : it.value;
      console.error(`    L${it.line}  [${tag}]  ${JSON.stringify(snippet)}`);
    }
  }
  console.error(
    `\nMove these strings into web/src/messages/{en,fr}.json and use ` +
      `useTranslations / getTranslations from next-intl.`
  );
  console.error(
    `Add intentional bilingual constants (e.g. form-preview content) to the SKIP_FILES list at the top of this script.`
  );

  return 1;
}

process.exit(main());
