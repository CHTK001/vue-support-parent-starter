#!/usr/bin/env node

import { execaCommand } from "@repo/node";
import { select, cancel, isCancel } from "@clack/prompts";

const iconifyCommands = [
  {
    label: "API Server",
    value: "start",
    description: "Start Iconify API server",
  },
  { label: "Vue 2", value: "dev:vue2", description: "Run Vue 2 example" },
  { label: "Vue 3", value: "dev:vue3", description: "Run Vue 3 example" },
  { label: "Nuxt 2", value: "dev:nuxt2", description: "Run Nuxt 2 example" },
  { label: "Nuxt 3", value: "dev:nuxt3", description: "Run Nuxt 3 example" },
  { label: "React", value: "dev:react", description: "Run React example" },
  { label: "Preact", value: "dev:preact", description: "Run Preact example" },
  { label: "Next.js", value: "dev:next", description: "Run Next.js example" },
  { label: "Svelte", value: "dev:svelte", description: "Run Svelte example" },
];

async function main() {
  const selectedCommand = await select({
    message: "Select Iconify offline example to run:",
    options: iconifyCommands.map((cmd) => ({
      label: cmd.label,
      value: cmd.value,
      hint: cmd.description,
    })),
  });

  if (isCancel(selectedCommand) || !selectedCommand) {
    cancel("👋 Operation cancelled");
    process.exit(0);
  }

  console.log(`\n🚀 Running ${selectedCommand}...\n`);

  try {
    await execaCommand(
      `pnpm --filter=iconify-offline-arrange run ${selectedCommand}`,
      {
        stdio: "inherit",
      },
    );
  } catch (error) {
    console.error(`\n❌ Command failed:`, error.message);
    process.exit(1);
  }
}

main();
