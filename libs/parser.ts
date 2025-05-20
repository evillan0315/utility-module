import * as fs from 'fs';
import * as path from 'path';

export interface ParsedField {
  name: string;
  prismaType: string;
  tsType: string;
  type: string;
  isOptional: boolean;
  isRelation: boolean;
  relationType: 'one-to-many' | 'many-to-one' | null;
  validators: string[];
}

export interface ScalarField extends ParsedField {
  isRelation: false;
  relationType: null;
}

export interface ModelParseResult {
  fields: ScalarField[];
  hasCreatedBy: boolean;
}

export function parseModel(modelName: string): ModelParseResult {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf8');

  const modelRegex = new RegExp(`model\\s+${modelName}\\s+{([\\s\\S]*?)}`, 'm');
  const match = content.match(modelRegex);
  if (!match) throw new Error(`Model ${modelName} not found.`);

  const SCALAR_TYPES = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'DateTime',
    'Json',
    'Bytes',
    'Decimal',
    'BigInt',
  ];

  let hasCreatedBy = false;

  const fields = match[1]
    .trim()
    .split('\n')
    .map((line) => {
      const cleanedLine = line.trim().replace(/\/\/.*/, '');
      if (!cleanedLine) return null;

      const parts = cleanedLine.split(/\s+/);
      if (parts.length < 2) return null;

      const [name, rawType] = parts;
      const isOptional = rawType.endsWith('?');
      const isArray = rawType.includes('[]');
      const cleanType = rawType.replace('?', '').replace('[]', '');

      const isRelation = !SCALAR_TYPES.includes(cleanType);
      const relationType: ParsedField['relationType'] =
        isRelation && isArray
          ? 'one-to-many'
          : isRelation && !isArray
            ? 'many-to-one'
            : null;

      if (name === 'createdBy' || name === 'createdById') {
        hasCreatedBy = true;
      }

      if (relationType !== null) {
        return null; // skip relational fields from scalar list
      }

      const { tsType, validators } = mapPrismaTypeToTsType(
        cleanType,
        isOptional,
        isArray,
        name,
      );

      return {
        name,
        prismaType: cleanType,
        tsType: isArray ? `${tsType}[]` : tsType,
        type: isArray ? `${tsType}[]` : tsType,
        isOptional,
        isRelation: false,
        relationType: null,
        validators,
      } satisfies ScalarField;
    })
    .filter((field): field is ScalarField => field !== null);

  return {
    fields,
    hasCreatedBy,
  };
}

function mapPrismaTypeToTsType(
  prismaType: string,
  isOptional: boolean,
  isArray: boolean,
  fieldName: string,
): {
  tsType: string;
  validators: string[];
} {
  let tsType = 'any';
  let validators: string[] = [];

  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  const isEmailField = fieldName.toLowerCase().includes('email');

  const decorate = (decorator: string, msg: string): string =>
    [
      'IsString',
      'IsOptional',
      'IsDate',
      'IsInt',
      'IsNumber',
      'IsBoolean',
      'IsObject',
      'IsEmail',
    ].includes(decorator)
      ? `@${decorator}()`
      : `@${decorator}({ message: '${msg}' })`;

  switch (prismaType) {
    case 'String':
      tsType = 'string';
      if (isEmailField) {
        validators.push(
          decorate('IsEmail', `${label} must be a valid email address.`),
        );
      } else {
        validators.push(decorate('IsString', `${label} must be a string.`));
      }
      break;
    case 'Int':
      tsType = 'number';
      validators.push(decorate('IsInt', `${label} must be an integer.`));
      break;
    case 'Float':
      tsType = 'number';
      validators.push(decorate('IsNumber', `${label} must be a float.`));
      break;
    case 'Boolean':
      tsType = 'boolean';
      validators.push(decorate('IsBoolean', `${label} must be true or false.`));
      break;
    case 'DateTime':
      tsType = 'Date';
      validators.push(decorate('IsDate', `${label} must be a date.`));
      break;
    case 'Json':
      tsType = 'any';
      validators.push(decorate('IsObject', `${label} must be an object.`));
      break;
    default:
      tsType = 'string';
      validators.push(decorate('IsString', `${label} must be a string.`));
      break;
  }

  if (isOptional) {
    validators.unshift(decorate('IsOptional', `${label} is optional.`));
  }

  return { tsType, validators };
}
