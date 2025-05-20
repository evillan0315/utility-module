import { generateResource } from './generator'; // Handles DTO/Module/Service/Controller gen
//import { updateAppModule } from "./updateAppModule";
import chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
// Slice args from command line
const args = process.argv.slice(2);

// Check for flags
const watch = args.includes('--watch');

// Extract --outDir and its value
const outDirFlag = args.find((arg) => arg.startsWith('--outDir='));
const outDir = outDirFlag ? outDirFlag.split('=')[1] : 'src'; // default output directory

// Get model name (the first non-flag argument that’s not part of --outDir)
const modelName = args.find((arg) => !arg.startsWith('--'));

if (!modelName && !watch) {
  console.error('❌ Please provide a model name or use --watch');
  process.exit(1);
}

async function generate(model: string) {
  await generateResource(model, outDir);
  // You can uncomment this line if you're ready to inject modules into AppModule
  //updateAppModule(model, outDir);
}

if (watch) {
  console.log(
    `👀 Watching for changes in schema.prisma (output to "${outDir}")...`,
  );
  chokidar.watch('../prisma/schema.prisma').on('change', async () => {
    console.log('📄 Detected change in schema.prisma...');
    const content = fs.readFileSync('schema.prisma', 'utf-8');
    const modelMatches = [...content.matchAll(/model\s+(\w+)\s+{/g)].map(
      (m) => m[1],
    );

    for (const model of modelMatches) {
      await generate(model);
    }
  });
} else if (modelName) {
  generate(modelName);
}
