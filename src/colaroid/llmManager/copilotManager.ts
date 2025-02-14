import * as vscode from "vscode";

const ANNOTATION_PROMPT_TEST = `You are assisting a student working through a structured tutorial on web programming (HTML, CSS, and JavaScript/TypeScript). 

### Task ###
Compare the student's solution with the master solution. Determine whether the student's solution achieves the same functionality as the master solution.

### Response Guidelines ###
- If the solutions are functionally equivalent, respond with exactly: "Your solution should be correct."
- If there are differences, provide a brief, actionable hint to guide the student toward improvement.
- Instead of revealing or describing content from the master solution, focus on explaining the specific concepts or structures the student should review.
- Rather than instructing the student to run the code in a browser, suggest reviewing specific parts of their code logic to identify potential errors.
- Frame your response constructively by highlighting areas for improvement and guiding the student toward an effective revision.
- The student is not in direct communication with you. Write your hint as if it will be shared with them through an intermediary or another interface.

### Provided Files Format ###
The student and master solutions are structured as complete HTML documents, with CSS and JavaScript included as inline styles and scripts. The files are processed as follows:
- **Master Solution:** A fully integrated HTML document.
- **Student Solution:** A corresponding attempt, structured in the same way.
- External CSS and JavaScript files referenced in <link> and <script> tags have been inlined into the document.

Below are the provided files:
`;

const ANNOTATION_PROMPT_HINT = `You are assisting a student in a step-by-step tutorial on web programming (HTML, CSS, and JavaScript/TypeScript). The student is stuck and needs guidance.

### Task ###
Analyze the differences between the student's solution and the master solution. Provide a useful hint to help the student progress.

### Response Guidelines ###
- Offer a concise, educational, and actionable hint.
- Instead of revealing or describing content from the master solution, focus on guiding the student toward understanding key differences and necessary changes.
- Instead of saying "It should match the master solution," describe what aspect of the student's implementation needs adjustment.
- Instead of suggesting to run the code in a browser, direct the student to inspect specific sections of their code for errors or missing logic.
- The student is not in direct communication with you. Write your hint as if it will be shared with them through an intermediary or another interface.

### Provided Files Format ###
The student and master solutions are structured as complete HTML documents, with CSS and JavaScript included as inline styles and scripts. The files are processed as follows:
- **Master Solution:** A fully integrated HTML document.
- **Student Solution:** A corresponding attempt, structured in the same way.
- External CSS and JavaScript files referenced in <link> and <script> tags have been inlined into the document.

Below are the provided files:
`;

export const testSave = async (masterSolution: string, studentSolution: string, type: string) => {

  try {
    const session = await vscode.authentication.getSession("github", ["read:user"], {
      createIfNone: false,
    });
  } catch (error) {
    console.error(error);
  }

  const models = await vscode.lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
  });

  let chatResponse: vscode.LanguageModelChatResponse | undefined;

  const files = `\nMaster Solution: ###\n${masterSolution}\n###\nStudent Solution: ###\n${studentSolution}\n###`;

  var annotation:string;
  if(type === "hint"){
    annotation = ANNOTATION_PROMPT_HINT
  } else if(type === "test") {
    annotation = ANNOTATION_PROMPT_TEST
  } else {
    throw new Error("Argument \"type\" of testSave has to be \"hint\" or \"test\"");
  }

  const messages = [
    vscode.LanguageModelChatMessage
      .User(annotation + files)
  ];

  try {
    chatResponse = await models[0].sendRequest(
      messages,
      {},
      new vscode.CancellationTokenSource().token
    );
  } catch (err) {
    if (err instanceof vscode.LanguageModelError) {
      console.log(err.message, err.code);
    } else {
      throw err;
    }
    return;
  }

  var response = "";

  for await (const fragment of chatResponse.text) {
    response += fragment;
  }

  return response;

}