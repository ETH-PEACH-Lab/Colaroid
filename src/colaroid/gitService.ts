import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import * as fs from "fs";
import { sleep } from "./utils";

export class GitService {
	private git: SimpleGit;
	private dir: string;
	constructor(dir: string) {
		const options: Partial<SimpleGitOptions> = {
			baseDir: dir,
			binary: "git",
			maxConcurrentProcesses: 6,
		};
		this.dir = dir;
		this.git = simpleGit(options);
		this.checkGitExist();
	}
	// this function checks if a git repo exists in the directory; in the future, we might think of using a dedicated branch to store Colaroid versions
	private checkGitExist = async () => {
		try {
			const statusResult = await this.git.status();
			await fs.writeFileSync(`${this.dir}/.gitignore`, ".colaroid");
		} catch (error) {
			const initResult = await this.git.init();
			await fs.writeFileSync(`${this.dir}/.gitignore`, ".colaroid");
		}
	};

	public createGitCommit = async (message: string): Promise<any> => {
		const addResult = await this.git.add(["--all"]);
		const commitResult = await this.git.commit(message);
		return commitResult;
	};
	public prepareEditing = async (hash: string): Promise<any> => {
		await this.git.checkout(["-b", "change"]);
		await this.git.reset(["--hard", hash]);
		console.log("finish preparing edits");
		return;
	};
	public rebaseChange = async (
		hashList: string[],
		hash: string
	): Promise<any> => {
		// first, commit the edits to the change branch;
		await this.git.add(["--all"]);
		await this.git.commit("Oops");


		// next, checkout to the merge branch
		await this.git.checkout(["-b", "merge"]);

		// uncommit the last commit
		await this.git.reset(["--soft", "HEAD^"]);

		// commit the change
		const commitResult = await this.git.commit("edit this step");
		const hashIndex = hashList.indexOf(hash);
		hashList[hashIndex] = commitResult.commit;

		// cherry pick future commits
		for (let i = hashIndex + 1; i < hashList.length; i++) {
            try {
                // ours - keep the original edits
                const pick = await this.git.raw(["cherry-pick", "--strategy-option=ours", hashList[i]]);
				console.log(pick);
			    const result = [...pick.matchAll(/\[merge (.*)\]/g)];
			    if (result.length > 0) {
                hashList[i] = result[0][1];
            }
            } catch (e) {
                console.log('Error occurred', e);
				await this.git.raw(["commit", "--allow-empty", "-m", "keep original"]); 
            }
			
		}

		// last rename branches
		// TODO
        await this.git.branch(["-D", "master"]);
        await this.git.branch(["-D", "change"]);
        await this.git.checkout(["-b", "master"]);
        await this.git.branch(["-D", "merge"]);

		return hashList;
	};
	public retrieveGitCommit = async (hash: string): Promise<any> => {
		let result: any[] = [];
		if (hash === "") {
			return { hash, result };
		}
		const hashResult = await this.git.catFile(["-p", hash]);
		const treeMatch = hashResult.match(/tree (.*)/);
		const treeID = treeMatch ? treeMatch[1] : "";
		const treeResult = await this.git.catFile(["-p", treeID]);
		const titleMatch = [
			...treeResult.matchAll(/blob (.*)\t([^.].*)\.(.*)/g),
		];

		for (let i = 0; i < titleMatch.length; i++) {
			let item = titleMatch[i];
			let blobID = item[1];
			let title = `${item[2]}.${item[3]}`;
			let format = item[3];
			let content = await this.git.catFile(["-p", blobID]);
			result.push({ content, title, format });
		}
		return { hash, result };
	};

	public revertGit = async (hash: string): Promise<any> => {
		const revertResult = await this.git.reset(["--hard", hash]);
		await sleep(1000);
		return true;
	};

	public generateDiff = async (
		hashA: string,
		hashB: string,
		file: string
	): Promise<any> => {
		const summary = await this.git.diffSummary([hashA, hashB, file]);
		const result = await this.git.diff([hashA, hashB, file]);
		return result;
	};

	public checkoutCommit = async (hash: string): Promise<any> => {
		const checkoutResult = await this.git.checkout([hash, "."]);
		return checkoutResult;
	};
}
