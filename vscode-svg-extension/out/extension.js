"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const svgBadgeProvider_1 = require("./svgBadgeProvider");
const svgOutlineProvider_1 = require("./svgOutlineProvider");
function activate(context) {
    const badgeProvider = new svgBadgeProvider_1.SvgFileDecorationProvider();
    const badgeDisposable = vscode.window.registerFileDecorationProvider(badgeProvider);
    const watcher = vscode.workspace.createFileSystemWatcher("**/*.svg");
    watcher.onDidCreate((uri) => badgeProvider.refresh(uri));
    watcher.onDidChange((uri) => badgeProvider.refresh(uri));
    watcher.onDidDelete((uri) => badgeProvider.refresh(uri));
    const selector = [
        { language: "xml", scheme: "file", pattern: "**/*.svg" },
        { language: "svg", scheme: "file", pattern: "**/*.svg" },
    ];
    const outlineDisposable = vscode.languages.registerDocumentSymbolProvider(selector, new svgOutlineProvider_1.SvgDocumentSymbolProvider());
    badgeProvider.refresh(undefined);
    context.subscriptions.push(badgeDisposable, watcher, outlineDisposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map