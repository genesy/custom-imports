// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { data } from './data.json';
import { PACKAGE_NAME } from './config';
import * as ts from 'typescript';
import * as vsc from 'vsc-base';

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('CUSTOM IMPORTS ACTIVE');

  vscode.commands.registerCommand(
    `${PACKAGE_NAME}.import`,
    (variable, source: string, isDefault) => {
      const document = vsc.getActiveDocument();
      let content = vsc.getDocumentContent();
      if (!content || !document) return;
      const sourceFile = vsc.tsCreateSourceFile(content);

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
        const re = new RegExp(`(["'])${source}\\1`);
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
            `\nimport {${SPACE}${variable}${SPACE}} from ${QUOTE}${source}${QUOTE}${SEMICOLON}\n`,
            lastImport.end,
          );
        } else {
          vsc.insertAt(
            `\nimport ${SPACE}${variable}${SPACE} from ${QUOTE}${source}${QUOTE}${SEMICOLON}\n`,
            lastImport.end,
          );
        }
      } else {
        // TODO: for empty files
      }
    },
  );

  // TODO: add other languages, js, jsreact etc
  const x = vscode.languages.registerCompletionItemProvider(
    ['typescriptreact', 'javascriptreact'],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext,
      ) {
        let items: vscode.CompletionItem[] = [];

        data.forEach(({ exports, source }) => {
          // TODO: don't show if already imported
          exports.forEach((exportName) => {
            const item = new vscode.CompletionItem(exportName, vscode.CompletionItemKind.Variable);
            item.detail = `::import from ${source}`;
            item.command = {
              title: 'import',
              command: `${PACKAGE_NAME}.import`,
              arguments: [exportName, source],
            };
            const asIndex = exportName.indexOf(' as ');
            const hasAlias = asIndex !== -1;
            if (hasAlias) {
              const alias = exportName.slice(asIndex + 4);
              item.sortText = alias;
              item.insertText = alias;
              item.label = alias;
            }

            items.push(item);
          });
        });

        return items;
      },
    },
  );
  context.subscriptions.push(x);
}

export function deactivate() {}
