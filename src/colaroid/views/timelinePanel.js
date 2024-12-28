//import showdown from 'showdown';

const vscode = acquireVsCodeApi();
const converter = new showdown.Converter();

// make panel persistant 
//TODO: How to handle the active step and active hash
const previousState = vscode.getState();
if (previousState) {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = previousState.timelineState;
    addAllEventListener();
}

function saveState() {
    const timelineState = document.getElementById("timeline").innerHTML;
    vscode.setState({ timelineState });
}

function addAllEventListener() {
    const studentButtons = document.getElementsByClassName("save-button");
    const masterButtons = document.getElementsByClassName("commit-button");

    for (const masterButton of masterButtons) {
        masterButton.addEventListener("click", () => {
            vscode.postMessage({
                command: "revert snapshot",
                id: masterButton.title,
            });
        });
    }

    for (const studentButton of studentButtons) {
        studentButton.addEventListener("click", () => {
            vscode.postMessage({
                command: "revert snapshot",
                id: studentButton.title,
            });
        });

        studentButton.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            vscode.postMessage({
                command: "remove student button",
                id: studentButton.title,
            });
        });
    }
}

var mode = "Explorer mode"

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

function changeMode(event) {
    if (mode === "Explorer mode") {
        mode = "Focus mode";
        const stepContainer = document.getElementsByClassName("step-container active");
        addFocusButtons(stepContainer[0]);
    } else {
        mode = "Explorer mode";
        removeFocusButtons();
    }
    event.target.textContent = mode;
    adjustAllLines();
    adjustSigmoidLines()
}

function addFocusButtons(stepContainer) {
    if (!stepContainer) {
        console.log("no active step")
        return null;
    }

    if (stepContainer.previousElementSibling) {
        console.log("prev focus")
        const focusButton = document.createElement("button");
        focusButton.className = "focus-button";
        focusButton.id = "prev-focus-Button";
        focusButton.textContent = "<";
        focusButton.onclick = prevStep;
        stepContainer.parentNode.insertBefore(focusButton, stepContainer);
    }

    if (stepContainer.nextElementSibling) {
        console.log("next focus")
        const focusButton = document.createElement("button");
        focusButton.className = "focus-button";
        focusButton.id = "next-focus-Button";
        focusButton.textContent = ">";
        focusButton.onclick = nextStep;
        stepContainer.insertAdjacentElement("afterend", focusButton);
    }

    console.log(stepContainer.length)
    console.log("in function: " + stepContainer.nextElementSibling)

}

function removeFocusButtons() {
    const buttons = document.querySelectorAll(".focus-button");
    buttons.forEach((button) => {
        button.remove();
    });
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
            const line = lines[lines.length - 1];

            adjustLineLenght(prevButton, commitButton, line);

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

function createSigmoidLine(masterbutton, studentButton, stepContainer) {

    if (stepContainer.querySelector(".svg-container")) {
        console.log("createSigmoidLine: Sigmoid Line already exists in " + stepContainer.id)
        return;
    }

    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const sigmoidLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');

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

    const svgWidth = Math.abs(x2 - x1);
    const svgHeight = Math.abs(y2 - y1);

    svgContainer.classList.add("svg-container");
    svgContainer.id = "svg-container-" + (stepContainer.id).slice(-1);
    svgContainer.setAttribute('width', svgWidth);
    svgContainer.setAttribute('height', svgHeight);
    svgContainer.style.position = 'absolute';
    svgContainer.style.left = `${x1}px`;
    svgContainer.style.top = `${y1}px`;

    sigmoidLine.setAttribute('d', `M${0},${0} C${65},${3} ${svgWidth - 65},${svgHeight - 3} ${svgWidth},${svgHeight}`);
    sigmoidLine.setAttribute('stroke', 'white');
    sigmoidLine.setAttribute('fill', 'none');
    sigmoidLine.setAttribute('stroke-width', '2');

    svgContainer.appendChild(sigmoidLine);
    stepContainer.appendChild(svgContainer)

}

function adjustSigmoidLines() {
    const svgContainers = document.querySelectorAll(".svg-container");
    svgContainers.forEach(svgContainer => {
        const step = parseInt((svgContainer.id).slice(-1), 10)
        const stepContainer = document.getElementById("step-container-" + step)
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
        svgContainer.style.left = `${x1}px`;

    });
}

document.getElementById('save-btn').addEventListener('click', saveStep);
document.getElementById('next-btn').addEventListener('click', nextStep);
document.getElementById('prev-btn').addEventListener('click', prevStep);
document.getElementById('change-mode').addEventListener('click', changeMode);
document.getElementById('load-button').addEventListener('click', displayStep);

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'updateTimelineMaster') {
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
        commitButton.title = message.hash;

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

    } else if (message.command === 'removeButton') {
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
            if (message.step === step) {
                buttons = stepContainer.querySelectorAll(".save-button");
                stepContainer.remove();
            } else if (message.step < step) {
                stepContainer.id = "step-container-" + (step - 1);
            }
            adjustAllLines();
            adjustSigmoidLines()
        })
    } else if (message.command === 'addStudent' ||
        message.command === 'updateTimelineStudent') {
        const stepContainer = document.getElementById("step-container-" + message.step);

        if (!stepContainer) {
            console.error("stepContainer " + message.step + " element not found!");
            return;
        }

        const studentBranch = stepContainer.querySelector("#studentBranch");

        // Add a line if this isn't the first commit
        if (studentBranch.children.length > 0) {
            const line = document.createElement("div");
            line.className = "line";
            studentBranch.appendChild(line);
        }

        // Create a button for the commit
        const commitButton = document.createElement("button");
        commitButton.className = "save-button";
        commitButton.title = message.hash;

        commitButton.addEventListener("click", () => {
            console.log("hash: " + message.hash);
            vscode.postMessage({
                command: "revert snapshot",
                id: message.hash,
            });
        });

        commitButton.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            vscode.postMessage({
                command: "remove student button",
                id: message.hash,
            });
            var line = commitButton.previousElementSibling;
            if (commitButton === studentBranch.firstElementChild) {
                line = commitButton.nextElementSibling;
            }
            if (line && line.classList.contains('line')) {
                line.remove();
            }

            commitButton.remove();
            adjustAllLines();
            adjustSigmoidLines()
        });

        studentBranch.appendChild(commitButton);

        adjustAllLines();
        adjustSigmoidLines()

    } else if (message.command === "update active state") {
        const stepContainers = document.querySelectorAll(".step-container");
        const stepDescription = document.getElementById("step-text");
        stepDescription.innerHTML = converter.makeHtml(message.content);
        console.log("WHICH ACTIVE STATE: " + message.state)
        stepContainers.forEach(stepContainer => {
            if (stepContainer.id === "step-container-" + message.state) {
                stepContainer.classList.add("active");

                stepContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center",
                });

                if (mode === "Focus mode") {
                    removeFocusButtons();
                    addFocusButtons(stepContainer);
                    adjustAllLines();
                    adjustSigmoidLines()
                }

                if (message.state > 0) {
                    const lineSolved = stepContainer.querySelector(".line-solved");
                    lineSolved.style.width = "100%";
                }

            } else {
                stepContainer.classList.remove("active");
            }
        });

        adjustAllLines();
        adjustSigmoidLines();

    } else if (message.command === "update active hash") {
        const saveButtons = document.querySelectorAll(".save-button")
        const commitButtons = document.querySelectorAll(".commit-button")
        const allButtons = [...saveButtons, ...commitButtons];
        allButtons.forEach(button => {
            if (button.title === message.hash) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    } else if (message.command === "clear view") {
        document.getElementById("timeline").innerHTML = "";
        vscode.postMessage({
            command: "view is clear",
        });
    }

    saveState()

});
