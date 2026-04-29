import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

const barrelDefinitions = [
  {
    entryFile: path.join(repoRoot, 'src/index.ts'),
    entrypoint: 'lightweight-orderflow-charts',
  },
  {
    entryFile: path.join(repoRoot, 'src/react.ts'),
    entrypoint: 'lightweight-orderflow-charts/react',
  },
];

const groupDefinitions = [
  {
    id: 'data-contracts',
    title: 'Data Contracts',
    description: 'Normalized market-data, session, and patch contracts.',
    test: (sourcePath) => sourcePath.includes('models/contracts'),
  },
  {
    id: 'options-and-configuration',
    title: 'Options And Configuration',
    description: 'Public option types, partials, defaults, and merge helpers.',
    test: (sourcePath) => sourcePath.includes('models/options'),
  },
  {
    id: 'study-models',
    title: 'Study Models',
    description: 'Derived view-model types emitted by the study calculations.',
    test: (sourcePath) => sourcePath.includes('models/studies'),
  },
  {
    id: 'presets-and-themes',
    title: 'Presets And Themes',
    description: 'Published style packs, theme packs, and related preset helpers.',
    test: (sourcePath) => sourcePath.includes('presets/'),
  },
  {
    id: 'normalization-and-sessions',
    title: 'Normalization And Sessions',
    description: 'Adapters for moving upstream data into the public contracts.',
    test: (sourcePath) => sourcePath.includes('adapters/'),
  },
  {
    id: 'calculations',
    title: 'Calculations',
    description: 'Pure helpers for footprint, profile, heatmap, pivot, and VWAP derivation.',
    test: (sourcePath) => sourcePath.includes('calculations/'),
  },
  {
    id: 'renderers-and-primitives',
    title: 'Renderers And Primitives',
    description: 'Series and primitive factories for chart rendering.',
    test: (sourcePath) => sourcePath.includes('renderers/'),
  },
  {
    id: 'controllers',
    title: 'Controllers',
    description: 'Controller-style helpers for tick streams and live updates.',
    test: (sourcePath) => sourcePath.includes('controllers/'),
  },
  {
    id: 'utilities',
    title: 'Utilities',
    description: 'General-purpose helpers for color, chart state, auto-fit, aggregation, and formatting.',
    test: (sourcePath) => sourcePath.includes('utils/'),
  },
  {
    id: 'react-context',
    title: 'React Context',
    description: 'React chart-context exports for sharing the chart instance.',
    test: (sourcePath) => sourcePath.includes('react/context/'),
  },
  {
    id: 'react-components',
    title: 'React Components',
    description: 'React components that mount studies and primitives into a chart.',
    test: (sourcePath) => sourcePath.includes('react/components/'),
  },
  {
    id: 'react-hooks',
    title: 'React Hooks',
    description: 'Hooks for lifecycle wiring around studies and primitives.',
    test: (sourcePath) => sourcePath.includes('react/hooks/'),
  },
  {
    id: 'other',
    title: 'Other Exports',
    description: 'Fallback group for public exports that do not match a more specific category.',
    test: () => true,
  },
];

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function formatTypeParameters(parameters) {
  if (!parameters?.length) {
    return '';
  }

  return `<${parameters.map((parameter) => parameter.name.getText()).join(', ')}>`;
}

function truncate(value, limit = 180) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1)}…`;
}

function resolveDeclaration(symbol, fallbackDeclarations = []) {
  const declarations = symbol.getDeclarations() ?? fallbackDeclarations;
  return (
    declarations.find(
      (declaration) =>
        !ts.isExportSpecifier(declaration) &&
        !ts.isExportDeclaration(declaration) &&
        !ts.isSourceFile(declaration),
    ) ?? declarations[0]
  );
}

function resolveKind(symbol, declaration) {
  if (!declaration) {
    if (symbol.flags & ts.SymbolFlags.Function) {
      return 'function';
    }

    if (symbol.flags & ts.SymbolFlags.TypeAlias) {
      return 'type alias';
    }

    if (symbol.flags & ts.SymbolFlags.Interface) {
      return 'interface';
    }

    if (symbol.flags & ts.SymbolFlags.Class) {
      return 'class';
    }

    if (symbol.flags & ts.SymbolFlags.Enum) {
      return 'enum';
    }

    return 'value';
  }

  if (ts.isFunctionDeclaration(declaration)) {
    return 'function';
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    return 'type alias';
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    return 'interface';
  }

  if (ts.isClassDeclaration(declaration)) {
    return 'class';
  }

  if (ts.isEnumDeclaration(declaration)) {
    return 'enum';
  }

  if (ts.isVariableDeclaration(declaration) || ts.isVariableStatement(declaration)) {
    return 'const';
  }

  return ts.SyntaxKind[declaration.kind]?.toLowerCase() ?? 'value';
}

function buildPreview(name, symbol, declaration, checker, kind) {
  if (!declaration) {
    return `${kind} ${name}`;
  }

  if (kind === 'function') {
    const symbolType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signature = checker.getSignaturesOfType(symbolType, ts.SignatureKind.Call)[0];

    if (signature) {
      return truncate(`function ${name}${checker.signatureToString(signature, declaration)}`);
    }

    return `function ${name}`;
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    return `type ${name}${formatTypeParameters(declaration.typeParameters)}`;
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    return `interface ${name}${formatTypeParameters(declaration.typeParameters)}`;
  }

  if (ts.isClassDeclaration(declaration)) {
    return `class ${name}${formatTypeParameters(declaration.typeParameters)}`;
  }

  if (ts.isEnumDeclaration(declaration)) {
    return `enum ${name}`;
  }

  if (ts.isVariableDeclaration(declaration) || ts.isVariableStatement(declaration)) {
    return `const ${name}`;
  }

  return `${kind} ${name}`;
}

function resolveGroup(sourcePath) {
  return groupDefinitions.find((group) => group.test(sourcePath)) ?? groupDefinitions.at(-1);
}

function escapeInlineMarkdown(value) {
  return value.replace(/`/g, '\\`');
}

const configPath = ts.findConfigFile(repoRoot, ts.sys.fileExists, 'tsconfig.json');

if (!configPath) {
  throw new Error('Unable to resolve tsconfig.json for API generation.');
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

if (configFile.error) {
  throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
}

const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, repoRoot);
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();

const apiEntries = barrelDefinitions.flatMap((barrel) => {
  const sourceFile = program.getSourceFile(barrel.entryFile);

  if (!sourceFile) {
    throw new Error(`Unable to load barrel file: ${barrel.entryFile}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

  if (!moduleSymbol) {
    throw new Error(`Unable to resolve module symbol for: ${barrel.entryFile}`);
  }

  return checker
    .getExportsOfModule(moduleSymbol)
    .filter((symbol) => symbol.name !== 'default')
    .map((symbol) => {
      const resolvedSymbol =
        symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      const declaration = resolveDeclaration(resolvedSymbol, symbol.getDeclarations() ?? []);
      const sourcePath = declaration
        ? path.relative(repoRoot, declaration.getSourceFile().fileName).replaceAll(path.sep, '/')
        : path.relative(repoRoot, barrel.entryFile).replaceAll(path.sep, '/');
      const group = resolveGroup(sourcePath);
      const description = normalizeWhitespace(
        ts.displayPartsToString(resolvedSymbol.getDocumentationComment(checker)),
      );
      const kind = resolveKind(resolvedSymbol, declaration);

      return {
        name: symbol.name,
        entrypoint: barrel.entrypoint,
        sourcePath,
        groupId: group.id,
        groupTitle: group.title,
        kind,
        description: description || null,
        preview: buildPreview(symbol.name, resolvedSymbol, declaration, checker, kind),
      };
    });
});

apiEntries.sort((left, right) => {
  if (left.groupTitle === right.groupTitle) {
    if (left.entrypoint === right.entrypoint) {
      return left.name.localeCompare(right.name);
    }

    return left.entrypoint.localeCompare(right.entrypoint);
  }

  return (
    groupDefinitions.findIndex((group) => group.id === left.groupId) -
    groupDefinitions.findIndex((group) => group.id === right.groupId)
  );
});

const groupedEntries = groupDefinitions
  .map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    entries: apiEntries.filter((entry) => entry.groupId === group.id),
  }))
  .filter((group) => group.entries.length > 0);

const documentedCount = apiEntries.filter((entry) => entry.description).length;
const generatedAt = new Date().toISOString();

const markdownLines = [
  '# API Reference',
  '',
  'This page is auto-generated from the public barrel exports in `src/index.ts` and `src/react.ts`.',
  '',
  'It is intended to stay aligned with the shipped package surface. To add richer descriptions for a symbol, add a JSDoc block to the exported declaration in source. The generator will include it here and in the docs-site search index.',
  '',
  '## Summary',
  '',
  `- Total public exports: ${apiEntries.length}`,
  `- Exports with JSDoc descriptions: ${documentedCount}`,
  '- Core entry point: `lightweight-orderflow-charts`',
  '- React entry point: `lightweight-orderflow-charts/react`',
  `- Generated at: \`${generatedAt}\``,
  '',
];

for (const group of groupedEntries) {
  markdownLines.push(`## ${group.title}`, '', group.description, '');

  for (const entry of group.entries) {
    markdownLines.push(
      `- \`${escapeInlineMarkdown(entry.name)}\` (\`${entry.kind}\`) from \`${entry.sourcePath}\` via \`${entry.entrypoint}\``,
      `  - Preview: \`${escapeInlineMarkdown(entry.preview)}\``,
    );

    if (entry.description) {
      markdownLines.push(`  - Description: ${entry.description}`);
    }

    markdownLines.push('');
  }
}

const generatedTsContents = `export const API_REFERENCE_GENERATED_AT = ${JSON.stringify(generatedAt)};\nexport const API_REFERENCE_DOCUMENTED_COUNT = ${documentedCount};\nexport const API_REFERENCE_TOTAL_COUNT = ${apiEntries.length};\nexport const API_REFERENCE_GROUPS = ${JSON.stringify(
  groupedEntries.map(({ id, title, description }) => ({ id, title, description })),
  null,
  2,
)} as const;\nexport const API_REFERENCE_ENTRIES = ${JSON.stringify(apiEntries, null, 2)} as const;\n`;

await mkdir(path.join(repoRoot, 'docs-site/src/generated'), { recursive: true });
await writeFile(path.join(repoRoot, 'docs/API_REFERENCE.md'), `${markdownLines.join('\n')}\n`);
await writeFile(
  path.join(repoRoot, 'docs-site/src/generated/apiReference.generated.ts'),
  generatedTsContents,
);

console.log(
  JSON.stringify({
    totalExports: apiEntries.length,
    documentedExports: documentedCount,
    generatedAt,
  }),
);
