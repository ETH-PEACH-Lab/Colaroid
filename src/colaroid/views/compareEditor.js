require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }
});

function getLanguage (format) {
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
            language = "typescript";
            break;
        default:
            language = "plain";
    }
    return language;
};

// taken from main.js and sliglty adjusted
function compareEditor(studentData, masterData, container) {
    let language;
    const result = masterData.result;
    const item = result[0];

    const cellWrapper = document.createElement("div");
    cellWrapper.classList = "code-cell-wrapper";
    const cellWrapperRow = document.createElement("div");
    cellWrapperRow.classList = "row";
    cellWrapper.id = `code-cell-wrapper-${studentData.hash}`;
    const codeCell = document.createElement("div");
    codeCell.classList = "code-cell col-10";
    codeCell.id = `code-cell-${studentData.hash}`;
    container.append(cellWrapper);
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
        document.getElementById(`code-cell-${studentData.hash}`),
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

    let prevContent = studentData.result;
    
        const diffCell = document.createElement("div");
        diffCell.classList = "diff-cell col-10";
        diffCell.id = `diff-cell-${studentData.hash}`;
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
            document.getElementById(`diff-cell-${studentData.hash}`),
            {
                theme: "vs-dark",
                folding: true,
                minimap: {
                    enabled: false,
                },
                automaticLayout: true,
                // Render the diff inline
                renderSideBySide: true,
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
            
        });
    });

    
    return cellWrapper;
};

window.compareEditor = compareEditor;
