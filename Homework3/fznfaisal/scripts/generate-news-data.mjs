import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const newsRoot = path.join(projectRoot, "data", "stocknews");
const outputPath = path.join(projectRoot, "src", "generated", "newsData.ts");

async function main() {
  const entries = await collectNewsEntries(newsRoot);
  const source = `export const rawNewsEntries = ${JSON.stringify(entries, null, 2)} as const;\n`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, source, "utf8");
  console.log(`Generated ${entries.length} news entries at ${outputPath}`);
}

async function collectNewsEntries(directory) {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const entries = [];

  for (const dirent of dirents) {
    const absolutePath = path.join(directory, dirent.name);

    if (dirent.isDirectory()) {
      entries.push(...(await collectNewsEntries(absolutePath)));
      continue;
    }

    if (!dirent.name.endsWith(".txt")) {
      continue;
    }

    const raw = await fs.readFile(absolutePath, "utf8");
    const relativePath = path.relative(projectRoot, absolutePath).split(path.sep).join("/");
    entries.push({ path: relativePath, raw });
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
