import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["content", "data"];
const allowedExtensions = new Set([".ts", ".tsx", ".json", ".md", ".txt"]);
const forbidden = [
  { label: "broad recursive deletion", pattern: /\brm\s+-[a-z]*r[a-z]*f\b/i },
  { label: "home wildcard deletion", pattern: /(?:\/root|\$HOME|~)\/\.\*/i },
  { label: "world-writable permission", pattern: /\bchmod\s+777\b/i },
  { label: "embedded private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...(await filesUnder(path)));
    else if (allowedExtensions.has(extname(entry.name))) paths.push(path);
  }
  return paths;
}

const failures = [];
for (const root of roots) {
  for (const path of await filesUnder(root)) {
    const source = await readFile(path, "utf8");
    for (const rule of forbidden) {
      if (rule.pattern.test(source)) failures.push(`${path}: ${rule.label}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("content safety scan passed");
}
