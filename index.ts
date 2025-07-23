import { exec } from "node:child_process";

/**
 * Options for configuring the Git class.
 * @interface GitOptions
 */
export interface GitOptions {
  /**
   * The working directory for Git commands. Defaults to the current process directory.
   * @type {string}
   */
  cwd?: string;
}

/**
 * A smart, user-friendly Git utility class for Node.js CLIs.
 *
 * `Git` provides a high-level interface for interacting with Git repositories using simple, intuitive commands.
 * Designed for use in GitNifty, it wraps common Git operations like checking repository status, retrieving user info,
 * detecting upstream branches, and more — all with clean automation and helpful defaults.
 *
 * This class is built to make version control effortless for developers who want precision and productivity,
 * without dealing with complex Git shell commands directly.
 *
 * @example
 * ```ts
 * import { Git } from "./Git";
 *
 * const git = new Git({ cwd: "/path/to/repo" });
 * const username = await git.user();
 * const branch = await git.currentBranch();
 * const isClean = await git.checkWorkingDirClean();
 * ```
 *
 * @remarks
 * - Built for Node.js CLI tools like GitNifty.
 * - Uses `child_process.exec` under the hood.
 * - Handles common Git tasks with automation-friendly methods.
 * - Falls back gracefully on errors, e.g., `checkUpstream()` or `checkWorkingDirClean()` return `false` instead of throwing.
 *
 * @see GitOptions
 */
export class Git {
  /**
   * The current working directory for Git commands.
   *
   * @private
   *
   * @type {string}
   */
  private cwd: string;

  /**
   * Creates an instance of the Git class.
   *
   * @param {GitOptions} options - Configuration options for the Git instance.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * ```
   */
  constructor(options: GitOptions) {
    this.cwd = options.cwd || process.cwd();
  }

  /**
   * Executes a Git command and handles errors gracefully.
   *
   * @private
   *
   * @template T - The expected return type of the command.
   *
   * @param {() => Promise<T>} cmd - The Git command to execute.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the command succeeds, `false` otherwise.
   */
  private tryCommand = async <T>(cmd: () => Promise<T>): Promise<boolean> => {
    try {
      await cmd();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Runs a Git command in the specified working directory.
   *
   * @private
   *
   * @param {string} cmd - The Git command to execute.
   *
   * @returns {Promise<string>} A promise that resolves with the command's stdout.
   *
   * @throws {string} Throws an error with the command and stderr if execution fails.
   */
  private runCommand(cmd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      exec(cmd, { cwd: this.cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(`Error executing command: ${cmd}\n${stderr}`);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Retrieves the configured Git user name.
   *
   * @returns {Promise<string>} A promise that resolves with the user's name.
   *
   * @throws {string} Throws an error if the command fails (e.g., Git not installed or user not configured).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const username = await git.getUserName();
   * console.log(username); // "John Doe"
   * ```
   */
  getUserName(): Promise<string> {
    return this.runCommand("git config user.name");
  }

  /**
   * Retrieves the configured Git user email.
   *
   * @returns {Promise<string>} A promise that resolves with the user's email.
   *
   * @throws {string} Throws an error if the command fails (e.g., Git not installed or email not configured).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const email = await git.getUserEmail();
   * console.log(email); // "john.doe@example.com"
   * ```
   */
  getUserEmail(): Promise<string> {
    return this.runCommand("git config user.email");
  }

  /**
   * Checks if there are no **unstaged** changes in the working directory.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if there are no unstaged changes, otherwise `false`.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * const clean = await git.hasNoUnstagedChanges();
   * console.log(clean); // true if working directory has no unstaged changes
   * ```
   */
  hasNoUnstagedChanges(): Promise<boolean> {
    return this.tryCommand(() => this.runCommand("git diff --quiet"));
  }

  /**
   * Checks if there are no **staged but uncommitted** changes.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if there are no staged changes, otherwise `false`.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * const clean = await git.hasNoStagedChanges();
   * console.log(clean); // true if nothing is staged for commit
   * ```
   */
  hasNoStagedChanges(): Promise<boolean> {
    return this.tryCommand(() => this.runCommand("git diff --cached --quiet"));
  }

  /**
   * Checks if the working directory is completely clean i.e., no staged or unstaged changes.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the working directory is fully clean, otherwise `false`.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * const isClean = await git.isWorkingDirClean();
   * console.log(isClean); // true if no changes, false if dirty
   * ```
   *
   * @see {@link hasNoUnstagedChanges} To check if working directory has unstaged changes.
   * @see {@link hasNoStagedChanges} To check if working directory has staged but uncommitted changes.
   */
  async isWorkingDirClean(): Promise<boolean> {
    const unstagedClean = await this.hasNoUnstagedChanges();
    const stagedClean = await this.hasNoStagedChanges();
    return unstagedClean && stagedClean;
  }

  /**
   * Checks if the current branch has an upstream branch configured.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if an upstream branch is set, `false` otherwise.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const hasUpstream = await git.hasUpstreamBranch();
   * console.log(hasUpstream); // true (if upstream is set), false (if not)
   * ```
   */
  hasUpstreamBranch(): Promise<boolean> {
    return this.tryCommand(() =>
      this.runCommand("git rev-parse --abbrev-ref --symbolic-full-name @{u}"),
    );
  }

  /**
   * Retrieves the name of the current branch.
   *
   * @returns {Promise<string>} A promise that resolves with the current branch name.
   *
   * @throws {string} Throws an error if the command fails (e.g., not a Git repository).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const branch = await git.getCurrentBranchName();
   * console.log(branch); // "main"
   * ```
   */
  getCurrentBranchName(): Promise<string> {
    return this.runCommand("git rev-parse --abbrev-ref HEAD");
  }

  /**
   * Retrieves the default branch name of the repository (e.g., `main` or `master`).
   *
   * Falls back to "main" if the default branch cannot be determined.
   *
   * @returns {Promise<string>} A promise that resolves with the default branch name.
   *
   * @throws {string} Throws an error if the command fails (e.g., not a Git repository).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const defaultBranch = await git.getDefaultBranchName();
   * console.log(defaultBranch); // "main" or "master"
   * ```
   */
  getDefaultBranchName = async (): Promise<string> => {
    const branches = await this.runCommand("git branch -r");
    const defaultBranch = branches
      .split("\n")
      .find((branch) => branch.includes("origin/HEAD"));
    return defaultBranch
      ? defaultBranch.replace("origin/HEAD -> origin/", "").trim()
      : "main";
  };
}
