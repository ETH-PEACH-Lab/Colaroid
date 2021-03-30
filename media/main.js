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
		let index = document.querySelectorAll(".cell-wrapper").length;
		const cellWrapper = generateWrapper(data);
		generateMarkdown(monaco, data, cellWrapper);
		generateCodeEditor(monaco, data, cellWrapper);
		generatePreview(data, cellWrapper);
		cellWrapper.scrollIntoView();
	};

	const hideStart = () => {
		const startContainer = document.querySelector("#start-container");
		startContainer.style.display = "none";
	};

	const generateMarkdown = (monaco, data, wrapper) => {
		const text = data.message;
		const markdownWrapper = document.createElement("div");
		markdownWrapper.classList = "md-cell-wrapper";
		markdownWrapper.id = `md-cell-wrapper-${data.hash}`;
		wrapper.append(markdownWrapper);

		const markdownCell = document.createElement("div");
		markdownCell.innerHTML = converter.makeHtml(text);
		markdownCell.classList = "md-cell-preview";
		markdownCell.id = `md-cell-preview-${data.hash}`;
		markdownWrapper.append(markdownCell);

		const markdownEditor = document.createElement("div");
		markdownEditor.classList = "md-cell-editor";
		markdownEditor.id = `md-cell-editor-${data.hash}`;
		markdownWrapper.append(markdownEditor);

		const editor = monaco.editor.create(
			// document.getElementById(`md-cell-editor-${data.hash}`),
			markdownEditor,
			{
				value: text,
				language: "markdown",
				wordWrap: "bounded",
				theme: "vs-dark",
				folding: true,
				minimap: {
					enabled: false,
				},
				automaticLayout: true,
			}
		);
		const contentHeight = (editor.getModel().getLineCount() + 2) * 19;
		markdownEditor.style.height = `${contentHeight}px`;
		markdownEditorList.push(editor);

		markdownEditor.classList.toggle("hide");
		markdownCell.addEventListener("dblclick", () => {
			markdownEditor.classList.toggle("hide");
			markdownCell.classList.toggle("hide");
		});

		let keysPressed = {};

		markdownEditor.addEventListener("keydown", (event) => {
			keysPressed[event.key] = true;
			if (event.key === "Enter" && keysPressed["Shift"]) {
				markdownEditor.classList.toggle("hide");
				markdownCell.classList.toggle("hide");
				let content = editor.getValue();
				content.replace("\n", "\r\n");
				content.replace("\n", "\r");
				vscode.postMessage({
					content,
					command: "revise message",
					id: data.hash,
				});
				markdownCell.innerHTML = converter.makeHtml(content);
			}
		});
		markdownEditor.addEventListener("keyup", (event) => {
			keysPressed[event.key] = false;
		});
	};
	const generateCodeEditor = (monaco, data, wrapper) => {
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
		cellWrapper.id = `code-cell-wrapper-${data.hash}`;
		const codeCell = document.createElement("div");
		codeCell.classList = "code-cell";
		codeCell.id = `code-cell-${data.hash}`;
		codeCell.setAttribute("data", data.content);
		wrapper.append(cellWrapper);
		cellWrapper.append(codeCell);
		const editor = monaco.editor.create(
			document.getElementById(`code-cell-${data.hash}`),
			{
				value: data.content,
				language,
				readOnly: true,
				theme: "vs-dark",
				folding: true,
				minimap: {
					enabled: false,
				},
				automaticLayout: true,
			}
		);
		const contentHeight = editor.getModel().getLineCount() * 19;
		codeCell.style.height = `${contentHeight}px`;
		codeEditorList.push(editor);

		const isFirst = document.querySelectorAll(".code-cell").length < 2;
		if (!isFirst) {
			const codeCells = document.querySelectorAll(".code-cell");
			const lastCodeCell = codeCells[codeCells.length - 2];
			const prevContent = lastCodeCell.getAttribute("data");

			const diffCell = document.createElement("div");
			diffCell.classList = "diff-cell";
			diffCell.id = `diff-cell-${data.hash}`;
			cellWrapper.append(diffCell);
			diffCell.classList.toggle("hide");

			const originalModel = monaco.editor.createModel(
				prevContent,
				"text/" + language
			);
			const modifiedModel = monaco.editor.createModel(
				data.content,
				"text/" + language
			);

			var diffEditor = monaco.editor.createDiffEditor(
				document.getElementById(`diff-cell-${data.hash}`),
				{
					theme: "vs-dark",
					folding: true,
					minimap: {
						enabled: false,
					},
					automaticLayout: true,
				}
			);
			diffEditor.setModel({
				original: originalModel,
				modified: modifiedModel,
			});
			let lastHeight = lastCodeCell.style.height;
			lastHeight = parseInt(lastHeight.slice(0, lastHeight.length - 2));
			const diffHeight =
				lastHeight > contentHeight ? lastHeight : contentHeight;
			diffCell.style.height = `${diffHeight}px`;
		}
		return cellWrapper;
	};

	const generatePreview = (data, wrapper) => {
		if (data.format === "html") {
			const previewWrapper = document.createElement("div");
			previewWrapper.classList = "preview-cell-wrapper";
			previewWrapper.id = `preview-cell-wrapper-${data.hash}`;
			const iframeEle = document.createElement("iframe");
			previewWrapper.append(iframeEle);
			wrapper.append(previewWrapper);
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
		}
	};

	const generateWrapper = (data) => {
		const wrapper = document.createElement("div");
		wrapper.className = "cell-wrapper";
		wrapper.id = `cell-wrapper-${data.hash}`;
		notebookBox.appendChild(wrapper);
		const toolbarWrapper = document.createElement("div");
		toolbarWrapper.className = "toolbar-wrapper";
		toolbarWrapper.id = `toolbar-wrapper-${data.hash}`;
		wrapper.appendChild(toolbarWrapper);
		const deleteBtn = document.createElement("button");
		deleteBtn.classList = "wrapper-button delete-button";
		deleteBtn.addEventListener("click", () => {
			wrapper.parentNode.removeChild(wrapper);
			vscode.postMessage({
				command: "remove cell",
				id: data.hash,
			});
		});
		toolbarWrapper.appendChild(deleteBtn);
		const toggleButton = document.createElement("button");
		toggleButton.classList = "wrapper-button toggle-button";
		toggleButton.classList.toggle("isdiff");

		toggleButton.addEventListener("click", () => {
			const codeCell = document.querySelector(`#code-cell-${data.hash}`);
			const diffCell = document.querySelector(`#diff-cell-${data.hash}`);
			if (diffCell) {
				toggleButton.classList.toggle("isdiff");
				codeCell.classList.toggle("hide");
				diffCell.classList.toggle("hide");
			}
		});

		toolbarWrapper.appendChild(toggleButton);
		const moveUpBtn = document.createElement("button");
		moveUpBtn.classList = "wrapper-button moveup-button";
		moveUpBtn.addEventListener("click", () => {
			if (wrapper.previousElementSibling) {
				wrapper.parentNode.insertBefore(
					wrapper,
					wrapper.previousElementSibling
				);
				vscode.postMessage({
					command: "move up cell",
					id: data.hash,
				});
			}
		});
		toolbarWrapper.appendChild(moveUpBtn);
		const moveDownBtn = document.createElement("button");
		moveDownBtn.classList = "wrapper-button movedown-button";
		moveDownBtn.addEventListener("click", () => {
			if (wrapper.nextElementSibling) {
				wrapper.parentNode.insertBefore(
					wrapper.nextElementSibling,
					wrapper
				);
				vscode.postMessage({
					command: "move down cell",
					id: data.hash,
				});
			}
		});
		toolbarWrapper.appendChild(moveDownBtn);
		// const displayBtn = document.createElement('button');
		// displayBtn.textContent = 'Display in Editor';
		// wrapper.appendChild(displayBtn);

		return wrapper;
	};

	const render = (data, command) => {
		return function () {
			if (data) {
				switch (command) {
					case "update":
						updateDoc(monaco, data);
						break;
					default:
						console.log("default");
				}
			}
			hideStart();
		};
	};

	window.addEventListener("message", (event) => {
		require(["vs/editor/editor.main"], render(
			event.data?.content,
			event.data?.command
		));
	});
})();
