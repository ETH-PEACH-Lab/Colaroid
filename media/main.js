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
        console.log('update doc');
        console.log(data);
		let index = document.querySelectorAll('.cell-wrapper').length;
        const cellWrapper = generateWrapper(index);
		generateMarkdown(monaco, data, index, cellWrapper);
		generateCodeEditor(monaco, data, index, cellWrapper);
        generatePreview(data, index, cellWrapper);
		cellWrapper.scrollIntoView();
	};

	const reviseDoc = (monaco, data) => {
		notebookBox.removeChild(
			notebookBox.childNodes[notebookBox.childNodes.length - 1]
		);
		let index = data.length - 1;
        const cellWrapper = generateWrapper(index);
		let ele = data[index];
		let prevEle = data[index - 1];
		generateMarkdown(monaco, ele, index, cellWrapper);
		const result = generateCodeEditor(monaco, ele, prevEle, index, cellWrapper);
        generatePreview(ele, index, cellWrapper);
		result.scrollIntoView();
	};

	const hideStart = () => {
		const startContainer = document.querySelector('#start-container');
		startContainer.style.display = 'none';
	};

	const generateMarkdown = (monaco, data, index, wrapper) => {
		const text = data.message;
		const markdownWrapper = document.createElement("div");
		markdownWrapper.classList = "md-cell-wrapper";
		markdownWrapper.id = `md-cell-wrapper-${index}`;
		wrapper.append(markdownWrapper);

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
	const generateCodeEditor = (monaco, data, index, wrapper) => {
		let language;
		console.log(data);
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
		cellWrapper.id = `code-cell-wrapper-${index}`;
		const codeCell = document.createElement("div");
		codeCell.classList = "code-cell";
		codeCell.id = "code-cell-" + index.toString();
        codeCell.setAttribute('data', data.content);
		wrapper.append(cellWrapper);
		cellWrapper.append(codeCell);
		const editor = monaco.editor.create(
			document.getElementById(`code-cell-${index}`),
			{
				value: data.content,
				language,
				readOnly: true,
				theme: "vs-dark",
				folding: true,
				minimap: {
					enabled: false
				},
				automaticLayout: true
			}
		);
		codeEditorList.push(editor);
		if (index > 0) {
            const codeCells = document.querySelectorAll('.code-cell');
            const lastCodeCell = codeCells[codeCells.length - 2];
            const prevContent = lastCodeCell.getAttribute('data');
            
			const diffCell = document.createElement("div");
			diffCell.classList = "diff-cell";
			diffCell.id = "diff-cell-" + index.toString();
			cellWrapper.append(diffCell);
			diffCell.classList.toggle("hide");

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
				prevContent,
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

	const generatePreview = (data, index, wrapper) => {
		const previewWrapper = document.createElement("div");
		previewWrapper.classList = "preview-cell-wrapper";
		previewWrapper.id = `preview-cell-wrapper-${index}`;
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
	};

    const generateWrapper = (index) => {
        const wrapper = document.createElement('div');
        wrapper.className = "cell-wrapper";
        wrapper.id = `cell-wrapper-${index}`;
        notebookBox.appendChild(wrapper); 
        const cellIndex = document.createElement('span');
        cellIndex.textContent = `[${index + 1}]`;
        wrapper.appendChild(cellIndex);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Cell';
        deleteBtn.addEventListener("click", ()=>{
            wrapper.parentNode.removeChild(wrapper);
            vscode.postMessage({
                command: "remove cell",
                index,
            });
        });
        wrapper.appendChild(deleteBtn);
        // const moveUpBtn = document.createElement('button');
        // moveUpBtn.textContent = 'Move Up';
        // wrapper.appendChild(moveUpBtn);
        // const moveDownBtn = document.createElement('button');
        // moveDownBtn.textContent = 'Move Down';
        // wrapper.appendChild(moveDownBtn);
        // const displayBtn = document.createElement('button');
        // displayBtn.textContent = 'Display in Editor';
        // wrapper.appendChild(displayBtn);

        return wrapper;
    };

	const generateDoc = (monaco, data) => {
		data.forEach((ele, index) => {
            const cellWrapper = generateWrapper(index);
			generateMarkdown(monaco, ele, index, cellWrapper);
			generateCodeEditor(monaco, ele, index, cellWrapper);
			generatePreview(ele, index, cellWrapper);
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
