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

	const createToolBar = () => {
		const toolbarWrapper = document.getElementById("toolbar-wrapper");
		const deleteBtn = document.createElement("button");
		deleteBtn.classList = "wrapper-button delete-button";
		deleteBtn.addEventListener("click", () => {
		});
		toolbarWrapper.appendChild(deleteBtn);
		const toggleButton = document.createElement("button");
		toggleButton.classList = "wrapper-button toggle-button";
		// toggleButton.classList.toggle("isdiff");

		toggleButton.addEventListener("click", () => {
		});

		toolbarWrapper.appendChild(toggleButton);
		const moveUpBtn = document.createElement("button");
		moveUpBtn.classList = "wrapper-button moveup-button";
		moveUpBtn.addEventListener("click", () => {
		});
		toolbarWrapper.appendChild(moveUpBtn);
		const moveDownBtn = document.createElement("button");
		moveDownBtn.classList = "wrapper-button movedown-button";
		moveDownBtn.addEventListener("click", () => {
		});
		toolbarWrapper.appendChild(moveDownBtn);
		// const displayBtn = document.createElement('button');
		// displayBtn.textContent = 'Display in Editor';
		// wrapper.appendChild(displayBtn);
		const revertBtn = document.createElement("button");
		revertBtn.classList = "wrapper-button revert-button";
		revertBtn.addEventListener("click", () => {
		});
		toolbarWrapper.appendChild(revertBtn);
	};

	createToolBar();

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

	const cleanDoc = () => {
		while(notebookBox.childElementCount > 0) {
			notebookBox.removeChild(notebookBox.firstChild);
		}	
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

	const getLanguage = (format) =>{
		let language = '';
		switch (format) {
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
		return language;
	};

	const generateCodeEditor = (monaco, data, wrapper) => {
		if(data.hash==='') {
			return;
		} 
		let language;
		const result = data.result;
		const item = result[0];

		const cellWrapper = document.createElement("div");
		cellWrapper.classList = "code-cell-wrapper";
		const cellWrapperRow = document.createElement("div");
		cellWrapperRow.classList = "row";
		cellWrapper.id = `code-cell-wrapper-${data.hash}`;
		const codeCell = document.createElement("div");
		codeCell.classList = "code-cell col-10";
		codeCell.id = `code-cell-${data.hash}`;
		codeCell.setAttribute("data", JSON.stringify(result));
		wrapper.append(cellWrapper);
		cellWrapper.append(cellWrapperRow);
		const fileListWrapper = document.createElement("div");
		fileListWrapper.classList = "title-list-wrapper col-2";
		const fileListTitle = document.createElement("div");
		fileListTitle.innerHTML = '<div class="title-list-title">FILE LIST</div>';
		fileListWrapper.appendChild(fileListTitle);
		const fileListContainer = document.createElement("ul");
		fileListWrapper.appendChild(fileListContainer);
		
		cellWrapperRow.append(fileListWrapper);
		cellWrapperRow.append(codeCell);
		const editor = monaco.editor.create(
			document.getElementById(`code-cell-${data.hash}`),
			{
				value: item.content,
				language: getLanguage(item.format),
				readOnly: true,
				theme: "vs-dark",
				folding: true,
				minimap: {
					enabled: false,
				},
				automaticLayout: true,
				renderOverviewRuler: false,
				scrollBeyondLastLine: false
			}
		);
		// const contentHeight = editor.getModel().getLineCount() * 19;
		codeCell.style.height = `150px`;
		codeEditorList.push(editor);

		const isFirst = document.querySelectorAll(".code-cell").length < 2;
		let prevContent = [];
        
		if (!isFirst) {
			const codeCells = document.querySelectorAll(".code-cell");
			const lastCodeCell = codeCells[codeCells.length - 2];
			prevContent = JSON.parse(lastCodeCell.getAttribute("data"));
			const diffCell = document.createElement("div");
			diffCell.classList = "diff-cell col-10";
			diffCell.id = `diff-cell-${data.hash}`;
			cellWrapperRow.append(diffCell);
			codeCell.classList.toggle("hide");

			const originalModel = monaco.editor.createModel(
				prevContent[0].content,
				"text/" + getLanguage(item.format)
			);
			const modifiedModel = monaco.editor.createModel(
				item.content,
				"text/" + getLanguage(item.format)
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
					// Render the diff inline
					renderSideBySide: false,
					renderIndicators:false,
					renderOverviewRuler: false,
					scrollBeyondLastLine: false
				}
			);
			diffEditor.setModel({
				original: originalModel,
				modified: modifiedModel,
			});
			diffEditor.onDidUpdateDiff(() => {
				const changes = diffEditor.getLineChanges();
				if(changes.length > 0){					
					const startNumber = changes[0].originalStartLineNumber;
					diffEditor.revealLineNearTop(startNumber);
				}
			});
			// let lastHeight = lastCodeCell.style.height;
			// lastHeight = parseInt(lastHeight.slice(0, lastHeight.length - 2));
			// const diffHeight =
			// 	lastHeight > contentHeight ? lastHeight : contentHeight;
			// diffCell.style.height = `${diffHeight}px`;
			diffCell.style.height = `150px`;
		}

		result.forEach((i, idx) => {
			const fileListItem = document.createElement("li");
			fileListItem.innerText = i.title;
			fileListContainer.appendChild(fileListItem);
			if(idx === 0) {
				fileListItem.classList = "selected";
			}
			fileListItem.addEventListener("click", () => {
				const prevSelected = fileListContainer.querySelector('.selected');
				prevSelected.classList.toggle('selected');
				fileListItem.classList.toggle('selected');

				const newModel = monaco.editor.createModel(
					i.content,
					"text/" + getLanguage(i.format)
				);
				editor.setModel(newModel);
				if (!isFirst) {
					// change the diff view
					const originalModel = monaco.editor.createModel(
						prevContent[idx].content,
						"text/" + getLanguage(prevContent[idx].format)
					);
					const modifiedModel = monaco.editor.createModel(
						i.content,
						"text/" + getLanguage(i.format)
					);
					diffEditor.setModel({
						original: originalModel,
						modified: modifiedModel,
					});
				}
			});
		});

		
		return cellWrapper;
	};

	const generatePreview = (data, wrapper) => {
		if(data.hash==='') {
			return;
		} 
		const item = data.result[0];
		if (item.format === "html") {
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
			iframedoc.writeln(item.content);
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
		// toggleButton.classList.toggle("isdiff");

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
		const revertBtn = document.createElement("button");
		revertBtn.classList = "wrapper-button revert-button";
		revertBtn.addEventListener("click", () => {
			vscode.postMessage({
				command: "revert snapshot",
				id: data.hash,
			});
		});
		toolbarWrapper.appendChild(revertBtn);
		return wrapper;
	};

	const render = (data, command) => {
		return function () {
			if (data) {
				switch (command) {
					case "update":
						updateDoc(monaco, data);
						break;
					case "clean":
						cleanDoc();
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
