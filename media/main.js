(function () {
	const notebookBox = document.getElementById("notebook-container");
	const snapshotButton = document.getElementById("snapshot-btn");
	const snapshotInput = document.getElementById("snapshot-input");
	const vscode = acquireVsCodeApi();
	const converter = new showdown.Converter();
	const markdownEditorList = [];
	const codeEditorList = [];
	require.config({
		paths: { vs: "https://unpkg.com/monaco-editor@latest/min/vs" },
	});
	window.MonacoEnvironment = { getWorkerUrl: () => proxy };

	let proxy = URL.createObjectURL(
		new Blob(
			[
				`
	self.MonacoEnvironment = {
		baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
	};
	importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');
`,
			],
			{ type: "text/javascript" }
		)
	);

	snapshotButton.addEventListener("click", () => {
		const value = snapshotInput?.value;
		snapshotInput.value = "";
		vscode.postMessage({
			content: value,
			command: "add",
		});
	});
	const updateDoc = (monaco, data) => {
		let index = data.length - 1;
		let ele = data[index];
		let prevEle = data[index - 1];
		generateMarkdown(monaco, ele, index);
		const result = generateCodeEditor(monaco, ele, prevEle, index);
		result.scrollIntoView();
	};

	const reviseDoc = (monaco, data) => {
		notebookBox.removeChild(
			notebookBox.childNodes[notebookBox.childNodes.length - 1]
		);
		notebookBox.removeChild(
			notebookBox.childNodes[notebookBox.childNodes.length - 1]
		);
		let index = data.length - 1;
		let ele = data[index];
		let prevEle = data[index - 1];
		generateMarkdown(monaco, ele, index);
		const result = generateCodeEditor(monaco, ele, prevEle, index);
		result.scrollIntoView();
	};

	const generateMarkdown = (monaco, data, index) => {
		const text = data.message + "\n" + data.body;
		const markdownWrapper = document.createElement("div");
		markdownWrapper.classList = "md-cell-wrapper";
		markdownWrapper.id = "md-cell-wrapper-" + index.toString();
		notebookBox.append(markdownWrapper);

		const markdownCell = document.createElement("div");
		markdownCell.innerHTML = converter.makeHtml(text);
		markdownCell.classList = "md-cell-preview";
		markdownCell.id = "md-cell-preview-" + index.toString();
		markdownWrapper.append(markdownCell);

		const markdownEditor = document.createElement("div");
		markdownEditor.classList = "md-cell-editor";
		markdownEditor.id = "md-cell-editor-" + index.toString();
		markdownWrapper.append(markdownEditor);

		const editor = monaco.editor.create(
			document.getElementById("md-cell-editor-" + index.toString()),
			{
				value: text,
				language: "markdown",
				wordWrap: "bounded",
				theme: "vs-dark",
			}
		);
		markdownEditorList.push(editor);

		markdownEditor.classList.toggle("hide");
		markdownCell.addEventListener("dblclick", () => {
			markdownEditor.classList.toggle("hide");
			markdownCell.classList.toggle("hide");
		});

		markdownEditor.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				markdownEditor.classList.toggle("hide");
				markdownCell.classList.toggle("hide");
				let content = editor.getValue();
				content.replace("\n", "\r\n");
				content.replace("\n", "\r");
				vscode.postMessage({
					content,
					command: "revise message",
					index,
				});
				markdownCell.innerHTML = converter.makeHtml(content);
			}
		});
	};
	const generateCodeEditor = (monaco, data, prev, index) => {
		let language;
		switch (data.format) {
			case "js":
				language = "javascript";
				break;
			case "html":
				language = "html";
				break;
			case "css":
				language = "css";
				break;
			case "ts":
				langugage = "typescript";
				break;
			default:
				language = "plain";
		}

		const cellWrapper = document.createElement("div");
		cellWrapper.classList = "code-cell-wrapper";
		cellWrapper.id = "code-cell-wrapper-" + index.toString();
		const codeCell = document.createElement("div");
		codeCell.classList = "code-cell";
		codeCell.id = "code-cell-" + index.toString();
		notebookBox.append(cellWrapper);
		cellWrapper.append(codeCell);
		const editor = monaco.editor.create(
			document.getElementById("code-cell-" + index.toString()),
			{
				value: data.content,
				language,
				readOnly: true,
				theme: "vs-dark",
			}
		);
		codeEditorList.push(editor);
		if (index > 0) {
			const diffCell = document.createElement("div");
			diffCell.classList = "diff-cell";
			diffCell.id = "diff-cell-" + index.toString();
			cellWrapper.append(diffCell);
			codeCell.classList.toggle("hide");

			const toggleButton = document.createElement("button");
			toggleButton.classList = "toggle-button";
			toggleButton.classList.toggle("isdiff");

			toggleButton.addEventListener("click", () => {
				toggleButton.classList.toggle("isdiff");
				codeCell.classList.toggle("hide");
				diffCell.classList.toggle("hide");
			});

			cellWrapper.append(toggleButton);

			const originalModel = monaco.editor.createModel(
				prev.content,
				"text/" + language
			);
			const modifiedModel = monaco.editor.createModel(
				data.content,
				"text/" + language
			);

			var diffEditor = monaco.editor.createDiffEditor(
				document.getElementById("diff-cell-" + index.toString()),
				{
					theme: "vs-dark",
				}
			);
			diffEditor.setModel({
				original: originalModel,
				modified: modifiedModel,
			});
		}
		return cellWrapper;
	};

	const generatePreview = (data, index) => {
		const previewWrapper = document.createElement("div");
		previewWrapper.classList = "preview-cell-wrapper";
		previewWrapper.id = "preview-cell-wrapper-" + index.toString();
		const iframeEle = document.createElement("iframe");
		previewWrapper.append(iframeEle);
		notebookBox.append(previewWrapper);
        // an interesting issue.. the string can't contain # if using data url. why??
		// iframeEle.setAttribute("src", "data:text/html, " + string);
		let iframedoc = iframeEle.document;
		if (iframeEle.contentDocument) {
			iframedoc = iframeEle.contentDocument;
		} else if (iframeEle.contentWindow) {
			iframedoc = iframeEle.contentWindow.document;
		}
		iframedoc.open();
		iframedoc.writeln(data.content);
		iframedoc.close();
	};

	const generateDoc = (monaco, data) => {
		let prevEle = null;
		data.forEach((ele, index) => {
			generateMarkdown(monaco, ele, index);
			generateCodeEditor(monaco, ele, prevEle, index);
			generatePreview(ele, index);
			prevEle = ele;
		});
	};
	const render = (data, command) => {
		return function () {
			if (data) {
				switch (command) {
					case "init":
						generateDoc(monaco, data);
						break;
					case "update":
						updateDoc(monaco, data);
						break;
					case "revise":
						reviseDoc(monaco, data);
						break;
					default:
						console.log("default");
				}
			}
		};
	};

	window.addEventListener("message", (event) => {
		require(["vs/editor/editor.main"], render(
			event.data?.content,
			event.data?.command
		));
	});
})();
