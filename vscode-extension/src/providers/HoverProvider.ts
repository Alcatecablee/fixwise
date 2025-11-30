import * as vscode from "vscode";
import { IAnalysisClient } from "../utils/IAnalysisClient";

export class NeuroLintHoverProvider implements vscode.HoverProvider {
  constructor(
    private apiClient: IAnalysisClient,
    private outputChannel: vscode.OutputChannel,
  ) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(position);
    const text = line.text;

    // Provide basic hover information
    const hoverText = new vscode.MarkdownString();
    hoverText.appendMarkdown(`**NeuroLint Analysis**\n\n`);
    hoverText.appendMarkdown(`Line: ${position.line + 1}\n`);
    hoverText.appendMarkdown(`Column: ${position.character + 1}\n`);

    return new vscode.Hover(hoverText);
  }
}
