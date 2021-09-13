// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { data } from './data.json';
import { PACKAGE_NAME } from './config';
import * as ts from 'typescript';
import * as vsc from 'vsc-base';
import addImportToFile from './addImport';

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('CUSTOM IMPORTS ACTIVE');

  vscode.commands.registerCommand(
    `${PACKAGE_NAME}.import`,
    (variable, importSource: string, isDefault) => {
      const document = vsc.getActiveDocument();
      let content = vsc.getDocumentContent();
      if (!content || !document) return;
      const sourceFile = vsc.tsCreateSourceFile(content);
      addImportToFile(sourceFile, importSource, variable, isDefault);
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

        const createItem = (name: string, source: string, isDefault = false) => {
          const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
          item.detail = `::import from ${source}`;
          item.command = {
            title: 'import',
            command: `${PACKAGE_NAME}.import`,
            arguments: [name, source, isDefault],
          };
          return item;
        };
        data.forEach(({ exports, source, defaultName = '' }) => {
          // TODO: don't show completionitem if already imported
          if (defaultName) {
            const item = createItem(defaultName, source, true);
            items.push(item);
          }
          exports.forEach((exportName) => {
            const item = createItem(exportName, source);
            const asIndex = exportName.indexOf(' as ');
            const hasAlias = asIndex !== -1;
            if (hasAlias) {
              const alias = exportName.slice(asIndex + 4);
              const actual = exportName.slice(0, asIndex);
              item.sortText = alias;
              item.insertText = alias;
              item.label = `${alias}::${actual}`;
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
