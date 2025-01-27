const vscode = acquireVsCodeApi();
const converter = new showdown.Converter();

var activeHash = undefined;
var activeStep = undefined;

function saveStep() {
    vscode.postMessage({
        command: "save",
    });
}

function prevStep() {
    vscode.postMessage({
        command: "prevStep",
    });
}

function nextStep() {
    vscode.postMessage({
        command: "nextStep",
    });
}

function displayStep() {
    vscode.postMessage({
        command: "display step",
    });
}


function renderHash() {
    vscode.postMessage({
        command: "render hash",
        hash: activeHash
    });
}

function compare() {
    vscode.postMessage({
        command: "compare",
        hash: activeHash
    });
}

function verify() {
    verifyPopup(activeStep);
}

function openAuthor() {
    vscode.postMessage({
        command: "open author",
    });
}

function showSolution() {
    vscode.postMessage({
        command: "show solution",
    });
}

function llmTest(type) {
    vscode.postMessage({
        command: "llm call",
        type: type
    });
}

function resetStudent(){
    const lines = document.querySelectorAll("#studentBranch .line");
    const studentButtons = document.querySelectorAll(".save-button");
    lines.forEach(line=>{line.remove()});
    studentButtons.forEach( studentButton => {
        const hash = studentButton.id.split("-").pop();
        studentButton.remove();
        vscode.postMessage({
            command: "remove student button",
            id: hash,
        });
    })
    adjustAllLines();
}

function deleteSave() {
    const saveButton = document.getElementById("save-button-" + activeHash)
    const studentBranch = saveButton.parentElement;
    const commitStudent = document.getElementById("commit-student");
    const commitEmpty = document.getElementById("commit-empty");
    commitEmpty.style.display = "flex";
    commitStudent.style.display = "none";
    vscode.postMessage({
        command: "remove student button",
        id: activeHash,
    });
    var line = saveButton.previousElementSibling;
    var lineNext = undefined;
    if (saveButton === studentBranch.firstElementChild) {
        lineNext = saveButton.nextElementSibling;
    }
    if (line && line.classList.contains("line")) {
        line.remove();
    }
    if (lineNext && lineNext.classList.contains("line")) {
        lineNext.remove();
    }
    activeHash = undefined;
    saveButton.remove();
    adjustAllLines();
    adjustSigmoidLines()
}

function stepSolved(step) {
    const stepContainer = document.getElementById("step-container-" + step)
    stepContainer.classList.add("solved")
    if (step > 0) {
        const lineSolved = stepContainer.querySelector(".line-solved");
        lineSolved.style.width = "100%";
    }
}

function changeName(branch) {
    const name = document.getElementById(branch + "-name-input").value;
    const buttonName = branch === "student" ? "save-button-" : "commit-button-";
    const button = document.getElementById(buttonName + activeHash);
    button.title = name;
    vscode.postMessage({
        command: "change name",
        name: name,
        hash: activeHash,
        branch: branch
    });
}

function settings() {
    const sidePanel = document.getElementById("sidepanel");
    const btnContainer = document.getElementById("btn-container")
    const btns = btnContainer.querySelectorAll(".btn");
    const settings = document.getElementById("settings");
    const llmAssistance = document.getElementById("llm-assistance");
    if (sidePanel.style.width === "0px") {
        sidePanel.style.width = "200px";
        btns.forEach(btn => {
            btn.style.borderRight = "1px solid var(--vscode-button-separator)"
        })
        llmAssistance.style.display = "none";
        settings.style.display = "flex";
    } else {
        sidePanel.style.width = "0px";
        btns.forEach(btn => {
            btn.style.borderRight = "0px"
        })
        settings.style.display = "none";
    }
}

function llmAssistance() {
    const sidePanel = document.getElementById("sidepanel");
    const btnContainer = document.getElementById("btn-container")
    const btns = btnContainer.querySelectorAll(".btn");
    const llmAssistance = document.getElementById("llm-assistance");
    const settings = document.getElementById("settings");
    if (sidePanel.style.width === "0px") {
        sidePanel.style.width = "400px";
        btns.forEach(btn => {
            btn.style.borderRight = "1px solid var(--vscode-button-separator)"
        })
        settings.style.display = "none";
        llmAssistance.style.display = "flex";
    } else {
        sidePanel.style.width = "0px";
        btns.forEach(btn => {
            btn.style.borderRight = "0px"
        })
        llmAssistance.style.display = "none";
    }
}

function resetSolve() {
    let i = 0;
    while (resetSolveStep(i)) { i++ };
    vscode.postMessage({
        command: "reset solved",
        step: undefined
    });
}

// returns false if step does not exist
function resetSolveStep(step) {
    const stepContainer = document.getElementById("step-container-" + step);
    if (!stepContainer) return false;
    //there should only be one line-solved for each stepcontainer in the .masterBranch
    if (step > 0) {
        const solvedLine = stepContainer.getElementsByClassName("line-solved")[0];
        solvedLine.style.width = "0%";
    }
    stepContainer.classList.remove("solved");

    const studentButton = stepContainer.querySelector(".save-button.endpoint");
    if (studentButton) {
        studentButton.classList.remove("endpoint")
        vscode.postMessage({
            command: "reset from",
            hash: studentButton.id.split("-").pop()
        });
    }

    const nextStepContainer = document.getElementById("step-container-" + (step + 1));
    if (nextStepContainer) {
        const nextStudentButton = nextStepContainer.querySelector(".save-button.fromStudent");
        if (nextStudentButton) {
            nextStudentButton.classList.remove("fromStudent")
            var line = nextStudentButton.previousElementSibling;
            if (line && line.classList.contains("line")) {
                line.remove();
            }
            vscode.postMessage({
                command: "reset from",
                hash: nextStudentButton.id.split("-").pop()
            });
        }
    }
    return true;
}

function adjustAllLines() {
    if (document.getElementsByClassName("step-container").length > 1) {
        var tmpStepContainer = document.getElementById("step-container-" + 1);
        var step = 1;
        while (tmpStepContainer) {
            const prevStepContainer = document.getElementById("step-container-" + (step - 1));
            const prevButtons = prevStepContainer.getElementsByClassName("commit-button");
            const prevButton = prevButtons[prevButtons.length - 1];

            const commitButtons = tmpStepContainer.getElementsByClassName("commit-button");
            const commitButton = commitButtons[0];

            const masterBranch = tmpStepContainer.querySelector("#masterBranch");
            const lines = masterBranch.getElementsByClassName("line");
            // I guess this could also be just lines[0] as there should be just one masterbranh line
            const line = lines[lines.length - 1];

            adjustLineLenght(prevButton, commitButton, line);

            const prevStudentButton = prevStepContainer.querySelector(".save-button.endpoint");
            const studentButton = tmpStepContainer.querySelector(".save-button.fromStudent");
            if (prevStudentButton && studentButton) {
                const studentLine = studentButton.previousElementSibling;
                adjustLineLenght(prevStudentButton, studentButton, studentLine);
            }

            step++;
            tmpStepContainer = document.getElementById("step-container-" + step);
        }
    }
}

function adjustLineLenght(buttonLeft, buttonRight, Line) {
    const posLeft = buttonLeft.getBoundingClientRect();
    const posRight = buttonRight.getBoundingClientRect();
    const distance = posRight.left - posLeft.right;

    const timelineContainer = document.getElementById("timeline-container");
    const containerOffset = timelineContainer.getBoundingClientRect().left;

    Line.style.width = `${distance}px`;
    Line.style.position = "absolute";
    Line.style.left = `${posLeft.right + timelineContainer.scrollLeft - containerOffset}px`;
}

function createSigmoidLine(studentButton, stepContainer) {
    const masterbutton = stepContainer.querySelector(".commit-button");

    if (stepContainer.querySelector(".svg-container")) {
        console.log("createSigmoidLine: Sigmoid Line already exists in " + stepContainer.id)
        return;
    }

    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const sigmoidLine = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const timelineContainer = document.getElementById("timeline-container");
    const containerOffsetLeft = timelineContainer.getBoundingClientRect().left;
    const containerOffsetTop = timelineContainer.getBoundingClientRect().top;
    const buttonHeightOffset = masterbutton.offsetHeight / 2;

    /*
        -Assumes that there is only one button in the master branch of the left container.
        -Assumes that the first button in the student branch of the right container 
         is the correct button for the path (Sigmoid Line) connection
    */

    const studentBranch = stepContainer.querySelector("#studentBranch");
    const posLeftHeight = masterbutton.getBoundingClientRect();
    const posLeftWidth = studentBranch.getBoundingClientRect();
    const posRight = studentButton.getBoundingClientRect();
    const y1 = posLeftHeight.top - containerOffsetTop + buttonHeightOffset;
    const x1 = posLeftWidth.right + timelineContainer.scrollLeft - containerOffsetLeft;
    const y2 = posRight.top - containerOffsetTop + buttonHeightOffset;
    const x2 = posRight.left + timelineContainer.scrollLeft - containerOffsetLeft;

    const svgWidth = Math.abs(x2 - x1 - 15);
    const svgHeight = Math.abs(y2 - y1);

    svgContainer.classList.add("svg-container");
    svgContainer.id = "svg-container-" + (parseInt((stepContainer.id).slice(-1)) + 1);
    svgContainer.setAttribute("width", svgWidth);
    svgContainer.setAttribute("height", svgHeight + 2);
    svgContainer.style.position = "absolute";
    svgContainer.style.left = `${x1 + 15}px`;
    svgContainer.style.top = `${y1}px`;

    sigmoidLine.setAttribute("d", `M${0},${0} C${svgWidth - 15},${0} ${0},${svgHeight} ${svgWidth - 15},${svgHeight} 
        l ${15},${0}`);
    sigmoidLine.setAttribute("stroke", "#ccc");
    sigmoidLine.setAttribute("fill", "none");
    sigmoidLine.setAttribute("stroke-width", "2");

    svgContainer.appendChild(sigmoidLine);
    studentButton.appendChild(svgContainer)

}

function adjustSigmoidLines() {
    const svgContainers = document.querySelectorAll(".svg-container");
    svgContainers.forEach(svgContainer => {
        const step = parseInt((svgContainer.id).slice(-1), 10)
        const stepContainer = document.getElementById("step-container-" + (step - 1))
        /*
            -Assumes that there is only one button in the master branch of the left container.
            -Assumes that the first button in the student branch of the right container 
             is the correct button for the path (Sigmoid Line) connection
        */
        const studentBranch = stepContainer.querySelector("#studentBranch");
        const posLeft = studentBranch.getBoundingClientRect();
        const timelineContainer = document.getElementById("timeline-container");
        const containerOffsetLeft = timelineContainer.getBoundingClientRect().left;

        const x1 = posLeft.right + timelineContainer.scrollLeft - containerOffsetLeft;
        svgContainer.style.left = `${x1 + 15}px`;

    });
}

//Event Listeners 
document.getElementById("save-btn").addEventListener("click", saveStep);
document.getElementById("next-btn").addEventListener("click", nextStep);
document.getElementById("prev-btn").addEventListener("click", prevStep);
document.getElementById("load-button").addEventListener("click", displayStep);
document.getElementById("render-student-btn").addEventListener("click", renderHash);
document.getElementById("render-master-btn").addEventListener("click", renderHash);
document.getElementById("compare-btn").addEventListener("click", compare);
document.getElementById("delete-btn").addEventListener("click", deleteSave);
document.getElementById("verify-btn").addEventListener("click", verify);
document.getElementById("settings-btn").addEventListener("click", settings);
document.getElementById("reset-solve-btn").addEventListener("click", resetSolve);
document.getElementById("reset-student-btn").addEventListener("click", resetStudent);
document.getElementById("author-btn").addEventListener("click", openAuthor);
document.getElementById("student-change-name-btn").addEventListener("click", changeName.bind(null, "student"));
document.getElementById("master-change-name-btn").addEventListener("click", changeName.bind(null, "master"));
document.getElementById("show-solution").addEventListener("click", showSolution);
document.getElementById("copilot-btn").addEventListener("click", llmAssistance);
document.getElementById("llm-test-btn").addEventListener("click", llmTest.bind(null, "test"));
document.getElementById("llm-hint-btn").addEventListener("click", llmTest.bind(null, "hint"));

window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.command === "updateTimelineMaster") {
        var stepContainer = document.getElementById("step-container-" + message.step);

        if (!stepContainer) {
            const timeline = document.getElementById("timeline");
            stepContainer = document.createElement("div");
            stepContainer.className = "step-container";
            stepContainer.id = "step-container-" + message.step;
            const masterBranch = document.createElement("div");
            masterBranch.id = "masterBranch";
            const studentBranch = document.createElement("div");
            studentBranch.id = "studentBranch";
            stepContainer.appendChild(masterBranch)
            stepContainer.appendChild(studentBranch)
            timeline.appendChild(stepContainer);
        }

        const masterBranch = stepContainer.querySelector("#masterBranch");

        const commitButton = document.createElement("button");
        commitButton.className = "commit-button";
        commitButton.id = "commit-button-" + message.hash;
        commitButton.title = message.name;

        commitButton.addEventListener("click", () => {
            vscode.postMessage({
                command: "revert snapshot",
                id: message.hash,
            });
        });

        masterBranch.appendChild(commitButton);

        // TODO: assumes there is only one button in master branch has to updated if multiple solutions per step
        if (message.step > 0) {
            const prevStepContainer = document.getElementById("step-container-" + (message.step - 1));
            const prevButtons = prevStepContainer.getElementsByClassName("commit-button");
            const prevButton = prevButtons[prevButtons.length - 1];
            const line = document.createElement("div");
            line.className = "line";

            const lineSolved = document.createElement("div");
            lineSolved.className = "line-solved";
            line.appendChild(lineSolved);

            adjustLineLenght(prevButton, commitButton, line);
            //TODO: here assumes just one button
            masterBranch.insertBefore(line, commitButton);
        }

        if (message.solved) {
            stepSolved(message.step);
        }

    } else if (message.command === "removeButton") {
        //if masterbutton is removed
        const stepContainers = document.querySelectorAll(".step-container");

        //remove the line of the next step if its the first step
        if (message.step === 0 && stepContainers.length > 1) {
            const stepContainerTwo = document.getElementById("step-container-1");
            const masterBranch = stepContainerTwo.querySelector("#masterBranch");
            const line = masterBranch.querySelector(".line");
            line.remove();
        }

        stepContainers.forEach(stepContainer => {
            var step = parseInt((stepContainer.id).slice(-1), 10);
            const svgContainer = document.getElementById("svg-container-" + step);
            if (message.step === step) {
                stepContainer.remove();
            } else if (message.step < step) {
                if ((message.step + 1) === step) {
                    //deletes lines to next container and the colors fro the first buttons
                    const fromStudent = stepContainer.querySelector(".save-button.fromStudent");
                    const fromSMaster = stepContainer.querySelector(".save-button.fromMaster")
                    fromStudent.querySelector("line").remove();
                    fromStudent.classList.remove("fromStudent");
                    fromSMaster.classList.remove("fromMaster");
                }
                stepContainer.id = "step-container-" + (step - 1);
                if ((message.step + 1) === step && svgContainer) {
                    svgContainer.remove();
                } else if (svgContainer) {
                    svgContainer.id = "svg-container-" + (step - 1);
                }
            }
        })

        adjustAllLines();
        adjustSigmoidLines();

    } else if (message.command === "addStudent" ||
        message.command === "updateTimelineStudent") {
        const stepContainer = document.getElementById("step-container-" + message.step);
        const nSaves = stepContainer.querySelectorAll(".save-button").length;

        if (!stepContainer) {
            console.error("stepContainer " + message.step + " element not found!");
            return;
        }

        const studentBranch = stepContainer.querySelector("#studentBranch");

        // Add a line if this isn"t the first commit
        if (studentBranch.children.length > 0) {
            const line = document.createElement("div");
            line.className = "line";
            studentBranch.appendChild(line);
        }

        // Create a button for the commit
        const commitButton = document.createElement("button");
        commitButton.className = "save-button";
        commitButton.id = "save-button-" + message.hash;
        commitButton.title = message.name;

        commitButton.addEventListener("click", () => {
            console.log("hash: " + message.hash);
            vscode.postMessage({
                command: "revert snapshot",
                id: message.hash,
            });
        });

        studentBranch.appendChild(commitButton);

        if (message.from === "master") {
            commitButton.classList.add("fromMaster");
            const prevStepContainer = document.getElementById("step-container-" + (message.step - 1));
            createSigmoidLine(commitButton, prevStepContainer);
        } else if (message.from === "student") {
            commitButton.classList.add("fromStudent");
            const prevStepContainer = document.getElementById("step-container-" + (message.step - 1));
            const prevButton = prevStepContainer.querySelector(".save-button.endpoint");
            const line = document.createElement("div");
            line.className = "line";

            if (prevButton) adjustLineLenght(prevButton, commitButton, line);

            studentBranch.insertBefore(line, commitButton);
            //commitButton.appendChild(line);
        } else if (message.from === "endpoint") {
            commitButton.classList.add("endpoint")
        }

        adjustAllLines();
        adjustSigmoidLines()

    } else if (message.command === "update active step") {
        console.log("THIS IS ACTIVESTEP: " + message.step)
        activeStep = message.step;
        const stepContainers = document.querySelectorAll(".step-container");
        const stepDescription = document.getElementById("step-text");
        stepDescription.innerHTML = converter.makeHtml(message.content);
        stepContainers.forEach(stepContainer => {
            if (stepContainer.id === "step-container-" + message.step) {
                stepContainer.classList.add("active");

                stepContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center",
                });

                if (stepContainer.classList.contains("solved")) {
                    document.getElementById("save-btn").disabled = true;
                } else {
                    document.getElementById("save-btn").disabled = false;
                }

            } else {
                stepContainer.classList.remove("active");
            }
        });

        adjustAllLines();
        adjustSigmoidLines();

    } else if (message.command === "update active hash") {
        //TODO: instead of title give button set the id to hash to select more easily
        const saveButtons = document.querySelectorAll(".save-button")
        const commitButtons = document.querySelectorAll(".commit-button")
        const allButtons = [...saveButtons, ...commitButtons];
        allButtons.forEach(button => {
            if (button.id.endsWith(`-${message.hash}`)) {
                const commitStudent = document.getElementById("commit-student");
                const commitMaster = document.getElementById("commit-master");
                const commitEmpty = document.getElementById("commit-empty");
                if (button.classList.contains("save-button")) {
                    commitEmpty.style.display = "none";
                    commitMaster.style.display = "none";
                    commitStudent.style.display = "flex";
                    document.getElementById("student-name-input").value = button.title;
                } else if (button.classList.contains("commit-button")) {
                    commitEmpty.style.display = "none";
                    commitMaster.style.display = "flex";
                    commitStudent.style.display = "none";
                    document.getElementById("master-name-input").value = button.title;
                }
                button.classList.add("active");
                activeHash = message.hash;
            } else {
                button.classList.remove("active");
            }
        });
    } else if (message.command === "clear view") {
        document.getElementById("timeline").innerHTML = "";
        vscode.postMessage({
            command: "view is clear",
        });
    } else if (message.command === "llm response") {
        const llmResponseText = document.getElementById("llm-response-text");
        llmResponseText.textContent = message.text;
    }
});

/* 
Either hovering or contextmenu think about the thngs it shows when hovering (maybe just name)
*/

function createStudentPopup() {
    const hoverElement = document.getElementById("prev-btn");
    const popup = document.getElementById("popup");

    hoverElement.addEventListener("mouseover", () => {
        popup.style.display = "block";
    });

    hoverElement.addEventListener("mouseout", () => {
        popup.style.display = "none";
    });
}

function verifyPopup(step) {
    const verifyPopup = document.createElement("div")
    verifyPopup.className = "verify-popup";

    var radioContainer = undefined;
    const lastStep = document.getElementById("step-container-" + (step + 1)) === null;
    if (!lastStep) {
        radioContainer = saveNextStep(step);
    }
    //close button
    const closeButton = document.createElement("div");
    const i = document.createElement("i");
    i.className = "codicon codicon-close";
    closeButton.appendChild(i);
    closeButton.className = "close-btn";
    closeButton.addEventListener("click", () => {
        verifyPopup.remove();
    });

    // verify button & icon in pop window
    const verified = document.getElementById("step-container-" + step).classList.contains("solved");
    const verifyButtonPopup = document.createElement("button");
    verifyButtonPopup.id = "verify-button-popup";
    const verifyIcon = document.createElement("div");
    verifyIcon.id = "verify-icon"
    const i2 = document.createElement("i");
    if (verified) {
        verifyButtonPopup.classList.add("verified");
        i2.className = "codicon codicon-pass"
        verifyIcon.style.color = "#3a9f3a";
        verifyButtonPopup.appendChild(document.createTextNode("Verified"));
    } else {
        i2.className = "codicon codicon-circle-large"
        verifyIcon.style.color = "grey";
        verifyButtonPopup.appendChild(document.createTextNode("Verify"));
    }
    verifyIcon.appendChild(i2)

    verifyButtonPopup.addEventListener("click", () => {
        if (verifyButtonPopup.classList.contains("verified")) {
            const textNode = verifyButtonPopup.childNodes[0];
            textNode.nodeValue = "verify"
            i2.className = "codicon codicon-circle-large"
            verifyIcon.style.color = "grey";
            resetSolveStep(step);
            verifyButtonPopup.classList.remove("verified");
            console.log("STEP V: " + step)
            vscode.postMessage({
                command: "reset solved",
                step: step,
            });
            
            document.getElementById("save-btn").disabled = false;

            const newRadioContainer = saveNextStep(step);
            const oldRadioContainer = document.getElementById("radio-container");
            if (oldRadioContainer) {
                oldRadioContainer.replaceWith(newRadioContainer);
            }
            radioContainer = newRadioContainer
        } else {
            //disable to save while step is verified
            document.getElementById("save-btn").disabled = true;
            //apprearance changes
            const textNode = verifyButtonPopup.childNodes[0];
            textNode.nodeValue = "verified"
            verifyButtonPopup.classList.add("verified");
            i2.className = "codicon codicon-pass"
            verifyIcon.style.color = "#3a9f3a";
            stepSolved(step)
            const selectedHash = verifyPopup.querySelector("#select-save").value;
            vscode.postMessage({
                command: "verify",
                step: step,
                hash: selectedHash
            });

            if (!lastStep) {
                //student commit for next step
                const value = radioContainer.querySelector("input:checked").value;
                switch (value) {
                    case "1":
                        vscode.postMessage({
                            command: "take master",
                            step: step,
                            hash: selectedHash
                        })
                        break;
                    case "2":
                        console.log("THIS IS THE SELECTED HASH: " + selectedHash)
                        vscode.postMessage({
                            command: "take student",
                            step: step,
                            hash: selectedHash
                        })
                        break;
                    case "3":
                        vscode.postMessage({
                            command: "take nothing",
                            step: step,
                            hash: selectedHash
                        })
                        break;
                }
            }
        }
    });

    const radioSelectContainer = document.createElement("div");
    radioSelectContainer.id = "radio-select-container"
    radioSelectContainer.appendChild(createSelection(step));
    if (!lastStep) radioSelectContainer.appendChild(radioContainer);

    verifyPopup.append(radioSelectContainer, verifyIcon, verifyButtonPopup, closeButton);
    document.body.appendChild(verifyPopup);
    dragElement(verifyPopup);
}

//https://www.w3schools.com/howto/howto_css_custom_checkbox.asp
function saveNextStep(step) {
    const studentBranch = document.querySelector(`#step-container-${step + 1} #studentBranch`);
    //next step already has stating point
    const inputCondition = studentBranch.querySelector(".save-button") === null;
    const radioContainer = document.createElement("div");
    radioContainer.id = "radio-container"
    const icons = ["codicon codicon-source-control",
        "codicon codicon-git-pull-request-draft",
        "codicon codicon-git-pull-request-closed"]

    const text = ["Take the master solution as your starting point for the next step",
        "Take your selected save as the starting point for the next step",
        "Don't create a starting point for the next step"]

    for (let i = 1; i <= 3; i++) {
        const label = document.createElement("label");
        label.className = "label-container";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "radio";
        input.value = `${i}`;
        if (i === 3) {
            input.checked = "checked"
        } else if (!inputCondition) {
            input.disabled = true;
        }
        label.appendChild(input)
        const box = document.createElement("div")
        box.className = "radio-box";
        const tooltip = document.createElement("div")
        tooltip.className= "tooltip";
        tooltip.textContent = text[i-1];
        const icon = document.createElement("i");
        icon.className = icons[i - 1];
        box.append(icon, tooltip)
        label.appendChild(box)
        radioContainer.appendChild(label)
    }

    return radioContainer;
}

function createSelection(step) {
    //choose hash for verification
    const select = document.createElement("select");
    select.id = "select-save"
    const stepContainer = document.getElementById("step-container-" + step);
    const buttons = stepContainer.querySelectorAll(".save-button");
    buttons.forEach((button, i) => {
        const option = document.createElement("option");
        option.value = button.id.split("-").pop();
        option.innerText = button.title;
        if (i === 0) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener("mousedown", (e) => {
        e.stopPropagation();
    });

    return select;
}
// function taken from https://www.w3schools.com/howto/howto_js_draggable.asp, made it not go outside of bounderies
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        elmnt.style.cursor = "grabbing";
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const top = elmnt.offsetTop - pos2;
        const left = elmnt.offsetLeft - pos1;

        // does not go outside of view
        const maxRight = window.innerWidth - elmnt.offsetWidth;
        const maxBottom = window.innerHeight - elmnt.offsetHeight;

        // set the element"s new position:
        elmnt.style.top = Math.min(Math.max(top, 0), maxBottom) + "px";
        elmnt.style.left = Math.min(Math.max(left, 0), maxRight) + "px";
    }

    function closeDragElement() {
        elmnt.style.cursor = "grab";
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
