// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { DOMParser, parseHTML } from 'linkedom';
import { NodeStruct } from 'linkedom/types/mixin/parent-node';
import { SerialMonitorApi, PortInformation, Version, getSerialMonitorApi } from '@microsoft/vscode-serial-monitor-api';


type Kvp = {
	name: string;
	value: string;
};

type HTMLElement = {
	attributes: Kvp[];
	innerHTML: string;
	textContent: string;
	tagName: string;
	children: HTMLElement[];
};

let attributes = {
	class: "classList",
	rowspan: "rowSpan",
};
let getSerialPorts: (resolve: (arg0: PortInformation[]) => void) => void;

export function activate(context: vscode.ExtensionContext) {
	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	getSerialPorts = async function (resolve: (arg0: PortInformation[]) => void) {
		console.log("running serial ports");
		let api = await getSerialMonitorApi(Version.latest, context);
		api?.listAvailablePorts().then(function (ports) {
			console.log("ports", ports);
			resolve(ports);
		});
	}

	function sendFilesList() {
		let files: vscode.Uri[];
		vscode.workspace.findFiles('**/*.*', '**/node_modules/**').then(e => {
			files = e;
		});
	}

	let disposable = vscode.commands.registerCommand('vscode-micropython-uploader.helloWorld', function () {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from VSCode Micropython Uploader!');
		// getSerialPorts(function (ports: PortInformation[]) { });
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (currentPanel) {
			// console.log("revealing panel");
			currentPanel.reveal(columnToShowIn);
		} else {
			// console.log("new panel");
			currentPanel = openUploader(context, vscode.window.activeTextEditor);
			// currentPanel.webview.postMessage(vscode);
			currentPanel.onDidDispose(function () {
				currentPanel = undefined;
			}, null, context.subscriptions);
		};

		context.subscriptions.push(disposable);
	});
}

export function deactivate() { }

function getCurrentViewColumn() {
	return vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn
		? vscode.window.activeTextEditor.viewColumn
		: vscode.ViewColumn.One;
}

function gvod(val: any, def: any) {
	if (val === undefined || val === null) {
		return def;
	}
	return val;
}
function openUploader(context: vscode.ExtensionContext, activeTextEditor: vscode.TextEditor | undefined): vscode.WebviewPanel {
	// console.log("openuploader");
	// const uri = activeTextEditor.document?.uri;
	let panel = vscode.window.createWebviewPanel('micropython-uploader', "Micropython Uploader", getCurrentViewColumn(), {
		enableFindWidget: false,
		enableCommandUris: true,
		enableScripts: true,
		retainContextWhenHidden: true
	});
	console.log(panel);


	// vscode.workspace.asRelativePath(gvod(gvod(gvod(activeTextEditor.document, "").uri, "").fsPath, ""));
	panel.webview.html = createEditorHtml(panel.webview, context);
	panel.webview.onDidReceiveMessage(function (args) {
		console.log("received message from webview:", args);
		let { message } = args;
		if (message === "getSerialPorts") {
			getSerialPorts(function (ports: PortInformation[]) {
				panel.webview.postMessage({
					message: "serialPortsList",
					data: ports
				});
			});
		}
	});
	return panel;
}

function getResourcePath(webview: vscode.Webview, context: vscode.ExtensionContext, filePath: string) {
	return `${webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, filePath).replace(/\\/g, '/')))}`;
}

function createEditorHtml(webview: vscode.Webview, context: vscode.ExtensionContext) {
	const _getResourcePath = getResourcePath.bind(undefined, webview, context);
	//@ts-ignore
	const { window, document, customElements, HTMLElement, Event, CustomEvent } = parseHTML(`<!doctype html>
<html lang="en">
	<head>
		<title>Hello SSR</title>
	</head>
	<body>
		<link rel="stylesheet" href="${_getResourcePath('uploader_src/styles.css')}">
		<script defer src="${_getResourcePath('uploader_src/jstools.js')}"></script>
		<script defer src="${_getResourcePath('uploader_src/uploader.js')}"></script>
	</body>
</html>`);
	// <button onclick="window.location.reload()">reload</button>


	// console.log("path", _getResourcePath('uploader_js/test.js'));
	return document.body.outerHTML;
}