import * as vscode from "vscode";

const ANNOTATION_PROMPT_TEST = `You are assisting a student working through a multi-step tutorial on web programming (HTML, CSS, and JavaScript/Typescript).
You will receive two files as strings: one is the student's solution, and the other is the master solution. 
Compare the two and determine if the student's solution achieves the same outcome as the master solution. 
If you believe they are equivalent in functionality, respond with exactly: "Your Solution should be correct." 
If they differ, provide a brief hint to guide the student towards improvement, without revealing any content from the master solution.
Important Notes: 
- Do not suggest running the code in a browser.
- Do not use phrases like "It should match the master solution" if some part is wrong, as the student does not know the master solution. Focus instead on describing specific areas in the student's code that need improvement or adjustment.
- The student is not in direct communication with you. Write your hint as if it will be shared with them through an intermediary or another interface.`;

const ANNOTATION_PROMPT_HINT = `You are assisting a student working through a multi-step tutorial on web programming (HTML, CSS, and JavaScript/Typescript).
You will receive two files as strings: one is the student's solution, and the other is the master solution. 
The student is stuck and needs a helpful hint to proceed. Provide a concise hint based on the differences you observe between the two files. 
Ensure the hint is actionable and educational, but do not reveal or describe any content from the master solution.
Important Notes: 
- Do not suggest running the code in a browser.
- Do not use phrases like "It should match the master solution" if some part is wrong, as the student does not know the master solution. Focus instead on describing specific areas in the student's code that need improvement or adjustment.
- The student is not in direct communication with you. Write your hint as if it will be shared with them through an intermediary or another interface.`;

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

  const files = `\n Master solution: ${masterSolution} \n Student solution: ${studentSolution}`;

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