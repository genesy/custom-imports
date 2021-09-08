// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { data } from './data.json';
import { PACKAGE_NAME } from './config';
import * as ts from 'typescript';

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "priority-imports" is now active!');

  vscode.window.showInformationMessage('Hello World from priority-imports!');

  vscode.commands.registerCommand(
    `${PACKAGE_NAME}.import`,
    (variable, source: string, isDefault) => {
      const content = vscode.window.activeTextEditor?.document.getText();
      if (!content) return;
      console.log({ variable, source, isDefault });

      const sourceFileName = `sourcefile_${new Date().getTime()}`;
      const sourceFile = ts.createSourceFile(sourceFileName, content, ts.ScriptTarget.ES2015, true);

      const importStatements = [];
      let theImport;
      const firstExpression = sourceFile.statements.find((node, index) => {
        if (!ts.isImportDeclaration(node)) return true;
        if (node.getFullText().indexOf(source) !== -1) {
          theImport = node;
        }
        importStatements.push(node);
      });

      // TODO: detect formatting of imports
      if (isDefault) {
        if (theImport) {
          // TODO: check if import statement is importing default or {}
        } else {
          // TODO: add this as new import
        }
      }
    },
  );

  // TODO: add other languages, js, jsreact etc
  const x = vscode.languages.registerCompletionItemProvider('typescriptreact', {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext,
    ) {
      let items: vscode.CompletionItem[] = [];

      data.forEach(({ variable, source, isDefault }) => {
        // TODO: figure out what kind in second param
        const item = new vscode.CompletionItem(variable);
        item.detail = `::import from ${source}`;
        item.command = {
          title: 'import',
          command: 'priority-imports.import',
          arguments: [variable, source, isDefault],
        };
        items.push(item);
      });

      return items;
    },
  });
  context.subscriptions.push(x);
}

export function deactivate() {}
