import * as vscode from "vscode";

export function getNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function injectWebviewAssets(
  html: string,
  webview: vscode.Webview,
  styleUris: vscode.Uri[],
  scriptUri?: vscode.Uri
): string {
  const nonce = getNonce();
  let result = html
    .replace(/\${webview.cspSource}/g, webview.cspSource)
    .replace(/\${nonce}/g, nonce);

  for (const styleUri of styleUris) {
    const uriString = styleUri.toString();
    if (!result.includes(uriString)) {
      result = result.replace(
        "</head>",
        `    <link href="${uriString}" rel="stylesheet">\n</head>`
      );
    }
  }

  if (scriptUri) {
    const uriString = scriptUri.toString();
    if (!result.includes(uriString)) {
      result = result.replace(
        "</body>",
        `    <script nonce="${nonce}" type="module" src="${uriString}"></script>\n</body>`
      );
    }
  }

  return result;
}
