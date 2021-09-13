import ts from 'typescript';
import * as vsc from 'vsc-base';

const addImportToFile = (
  sourceFile: ts.SourceFile,
  importSource: string,
  variable: string,
  isDefault = false,
) => {
  // TODO: scan file or tsconfig for actual format requirements
  const SPACE = ' ';
  const SEMICOLON = ';';
  const QUOTE = "'";

  const importStatements: ts.Node[] = [];
  let theImport: ts.Node | undefined;
  let firstExpression: ts.Node | undefined;

  sourceFile.statements.forEach((node, index) => {
    if (!ts.isImportDeclaration(node)) {
      firstExpression = node;
      return;
    }
    importStatements.push(node);

    // matches the name of the module/source path
    const re = new RegExp(`(["'])${importSource}\\1`);
    if (node.getFullText().match(re)) {
      theImport = node;
    }
  });

  const lastImport = importStatements[importStatements.length - 1];

  if (theImport) {
    const importStatement = theImport.getFullText();
    const openingBrace = `{${SPACE}`;
    const openingBraceIndex = importStatement.indexOf(openingBrace);
    if (!isDefault) {
      if (openingBraceIndex !== -1) {
        // insert before lasing closing brace
        const closingBrace = `${SPACE}}`;
        const closingBraceIndex = importStatement.indexOf(closingBrace);
        vsc.insertAt(`, ${variable}`, theImport.pos + closingBraceIndex);
        // content = vsc.insertAfter(content, /\{/, `${variable},${SPACE}`);
      } else {
        const fromTextIndex = importStatement.indexOf(' from ');
        vsc.insertAt(`,${SPACE}{${SPACE}${variable}${SPACE}}`, theImport.pos + fromTextIndex);
      }
    } else {
      vsc.insertAt(`${variable}, `, theImport.pos + 8); // 8 because `import ` length + 1 is static
    }
  } else if (lastImport) {
    if (!isDefault) {
      vsc.insertAt(
        `\nimport {${SPACE}${variable}${SPACE}} from ${QUOTE}${importSource}${QUOTE}${SEMICOLON}\n`,
        lastImport.end,
      );
    } else {
      vsc.insertAt(
        `\nimport ${SPACE}${variable}${SPACE} from ${QUOTE}${importSource}${QUOTE}${SEMICOLON}\n`,
        lastImport.end,
      );
    }
  } else {
    // TODO: for empty files
  }
};
