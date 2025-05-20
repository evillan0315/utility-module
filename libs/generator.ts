import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { parseModel } from './parser';
import { protectedModels } from './protected-models';

export async function generateResource(modelName: string, outDir?: string) {
  const className = capitalize(modelName);
  const fileName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const folderName = toDashCase(modelName);

  // Updated to extract fields and hasCreatedBy
  const { fields, hasCreatedBy } = parseModel(modelName);
  console.log(fields, 'fields');
  const isProtected = protectedModels.includes(className);

  const templates = [
    { name: 'controller', out: `${folderName}.controller.ts` },
    { name: 'service', out: `${folderName}.service.ts` },
    { name: 'module', out: `${folderName}.module.ts` },
    { name: 'create-dto', out: `dto/create-${folderName}.dto.ts` },
    { name: 'update-dto', out: `dto/update-${folderName}.dto.ts` },
    { name: 'views-controller', out: `views/views.controller.ts` },
  ];

  const targetDir = path.join(outDir || 'output', folderName);
  const dtoDir = path.join(targetDir, 'dto');
  const viewsDir = path.join(targetDir, 'views');
  fs.mkdirSync(dtoDir, { recursive: true });
  fs.mkdirSync(viewsDir, { recursive: true });
  for (const tpl of templates) {
    const template = fs.readFileSync(
      path.join(__dirname, 'templates', `${tpl.name}.ts.ejs`),
      'utf8',
    );

    const result = ejs.render(template, {
      className,
      fileName,
      fields,
      folderName,
      isProtected,
      hasCreatedBy, // Pass this into templates
    });

    const outPath = path.join(targetDir, tpl.out);
    fs.writeFileSync(outPath, result);
    console.log(`✔ Generated: ${outPath}`);
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toDashCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
