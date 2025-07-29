import { exec } from "node:child_process";

// ***** Types *****

/**
 * Options for configuring the {@link Git} class.
 *
 * @interface GitOptions
 *
 * @see {@link Git} - Clever Git, Made Simple
 */
export interface GitOptions {
  /**
   * The working directory for Git commands. Defaults to the current process directory.
   */
  cwd?: string;
}

/**
 * Defines the available flags for the `git reset` command.
 *
 * These flags control how Git modifies the index and working directory
 * when resetting to a specific commit.
 *
 * - `--soft`: Moves HEAD and keeps all changes staged.
 * - `--mixed`: Resets index but not the working directory (default).
 * - `--hard`: Resets index and working directory (⚠ destructive).
 * - `--merge`: Resets while preserving uncommitted merge changes.
 * - `--keep`: Similar to merge, but keeps local modifications.
 * - `--quiet`: Suppresses output messages during reset.
 * - `--verbose`: Outputs additional information during reset.
 *
 * @see {@link Git.reset}
 */
export type ResetFlag =
  | "--soft"
  | "--mixed"
  | "--hard"
  | "--merge"
  | "--keep"
  | "--quiet"
  | "--verbose";

/**
 * Represents valid flags for the `git restore` command.
 *
 * These flags control what is restored and from where. Useful for staging,
 * restoring from a specific commit, or restoring only to the working tree.
 *
 * - `--staged`: Restore changes to the index (unstages files).
 * - `--worktree`: Restore only to the working directory.
 * - `--quiet`: Suppress feedback messages.
 * - `--progress`: Force progress reporting.
 * - `--source=<commit-ish>` – Restore from a specific commit, branch, or tag.
 *
 * @example
 * - `--source=HEAD` – Restore from the latest commit on current branch.
 * - `--source=HEAD~1` – Restore from one commit before HEAD.
 * - `--source=abc1234` – Restore from a specific commit hash.
 * - `--source=main` – Restore from a named branch.
 *
 * @see {@link Git.restore}
 */
export type RestoreFlag =
  | "--staged"
  | "--worktree"
  | "--quiet"
  | "--progress"
  | "--source=HEAD"
  | `--source=HEAD~${number}`
  | `--source=${string}`;

/**
 * Represents valid flags for the `git commit` command.
 *
 * These flags modify commit behavior, such as bypassing hooks,
 * allowing empty commits, or including staged changes only.
 *
 * - `--amend`: Modify the last commit.
 * - `--no-edit`: Reuse the previous commit message.
 * - `--allow-empty`: Create a commit even if there are no changes.
 * - `--no-verify`: Skip pre-commit and commit-msg hooks.
 * - `--signoff`: Add a Signed-off-by line at the end of the commit message.
 * - `--verbose`: Show unified diff in the commit message editor.
 *
 * @see {@link Git.commit}
 */
export type CommitFlag =
  | "--amend"
  | "--no-edit"
  | "--allow-empty"
  | "--no-verify"
  | "--signoff"
  | "--verbose";

/**
 * Flags available for the `git push` command.
 *
 * These flags modify the behavior of pushing commits to a remote repository.
 *
 * - `--force`: Forces the push, overwriting remote history.
 * - `--force-with-lease`: Forces push only if remote hasn’t been updated.
 * - `--tags`: Push all tags to the remote.
 * - `--follow-tags`: Push annotated tags associated with commits.
 * - `--set-upstream`: Sets upstream (tracking) for the branch.
 * - `--dry-run`: Simulates push without making changes.
 * - `--delete`: Deletes the specified branch from the remote.
 * - `--all`: Pushes all branches.
 *
 * @see {@link Git.push}
 */
export type PushFlag =
  | "--force"
  | "--force-with-lease"
  | "--tags"
  | "--follow-tags"
  | "--set-upstream"
  | "--dry-run"
  | "--delete"
  | "--all";

/**
 * Flags available for the `git tag` command.
 *
 * These flags control tag creation, deletion, listing, and annotation.
 *
 * - `--annotate`: Creates an annotated tag with metadata.
 * - `--delete`: Deletes a tag.
 * - `--force`: Replaces an existing tag with the same name.
 * - `--list`: Lists all tags.
 *
 * @see {@link Git.tag}
 */
export type TagFlag = "--annotate" | "--delete" | "--force" | "--list";

/**
 * Flags available for the `git merge` command.
 *
 * These flags control how Git performs the merge operation.
 *
 * - `--no-ff`: Disables fast-forward merges.
 * - `--ff-only`: Only allows fast-forward merges.
 * - `--squash`: Combines changes into a single commit without a merge.
 * - `--no-commit`: Prevents an automatic commit after merge.
 * - `--commit`: Forces a commit if merge is successful.
 * - `--edit`: Opens the commit message editor after merging.
 * - `--no-edit`: Uses the default commit message without editing.
 * - `--strategy=ours`: Uses 'ours' strategy to favor current branch.
 * - `--strategy=recursive`: Uses the default recursive merge strategy.
 *
 * @see {@link Git.merge}
 */
export type MergeFlag =
  | "--no-ff"
  | "--ff-only"
  | "--squash"
  | "--no-commit"
  | "--commit"
  | "--edit"
  | "--no-edit"
  | "--strategy=ours"
  | "--strategy=recursive";

/**
 * Flags available for the `git checkout` command.
 *
 * These flags control checkout behavior including branch creation.
 *
 * - `-b`: Creates a new branch and checks it out.
 * - `-B`: Creates or resets a branch.
 * - `--detach`: Detaches HEAD to checkout a commit.
 * - `--force`: Forces checkout, discarding local changes.
 * - `--orphan`: Creates a new branch with no commit history.
 *
 * @see {@link Git.checkout}
 */
export type CheckoutFlag = "-b" | "-B" | "--detach" | "--force" | "--orphan";

/**
 * Flags available for the `git branch` command.
 *
 * These flags allow listing, deleting, renaming, and inspecting branches.
 *
 * - `-d`: Deletes a branch (safe, only if fully merged).
 * - `-D`: Deletes a branch forcefully (even if not merged).
 * - `-m`: Renames a branch.
 * - `-M`: Forcefully renames a branch (even if target exists).
 * - `--list`: Lists all branches.
 * - `--show-current`: Shows the name of the current branch.
 *
 * @see {@link Git.branch}
 */
export type BranchFlag =
  | "-d"
  | "-D"
  | "-m"
  | "-M"
  | "--list"
  | "--show-current";

// ***** Git Class *****

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
 * import { Git } from "./gitnifty";
 *
 * const git = new Git({ cwd: "/path/to/repo" });
 * const username = await git.getUserName();
 * const branch = await git.getCurrentBranchName();
 * const isClean = await git.isWorkingDirClean();
 * ```
 *
 * @remarks
 * - Built for Node.js CLI tools like GitNifty.
 * - Uses `child_process.exec` under the hood.
 * - Handles common Git tasks with automation-friendly methods.
 * - Falls back gracefully on errors, e.g., `hasUpstreamBranch()` or `isWorkingDirClean()` return `false` instead of throwing.
 *
 * @see {@link GitOptions} - Options for configuring the Git class.
 * @see {@link https://git-scm.com/docs | Git Official Documentation}
 */
export class Git {
  /**
   * The current working directory for Git commands.
   *
   * @private
   *
   */
  private cwd: string;

  /**
   * Creates an instance of the Git class.
   *
   * @param options - Configuration options for the Git instance.
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
   * @param cmd - The Git command to execute.
   *
   * @returns A promise that resolves to `true` if the command succeeds, `false` otherwise.
   */
  private tryCommand = async (cmd: () => Promise<string>) => {
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
   * @param cmd - The Git command to execute.
   *
   * @returns A promise that resolves with the command's stdout.
   *
   * @throws Throws an error with the command and stderr if execution fails.
   */
  private runCommand(cmd: string) {
    return new Promise<string>((resolve, reject) => {
      exec(cmd, { cwd: this.cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error executing command: ${cmd}\n${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  /**
   * Retrieves the configured Git user name.
   *
   * @returns A promise that resolves with the user's name.
   *
   * @throws Throws an error if the command fails (e.g., Git not installed or user not configured).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const username = await git.getUserName();
   * console.log(username); // "John Doe"
   * ```
   */
  getUserName() {
    return this.runCommand("git config user.name");
  }

  /**
   * Sets the global Git user name.
   *
   * This command configures the `user.name` value in the global Git configuration.
   * It wraps `git config --global user.name "<name>"`.
   *
   * @param name - The Git user name to set. If it includes spaces, it will be quoted automatically.
   *
   * @returns A promise that resolves when the name has been successfully set.
   *
   * @example
   * ```ts
   * await git.setUserName("John Doe");
   * const name = await git.getUserName();
   * console.log(name); // "John Doe"
   * ```
   */
  setUserName(name: string) {
    return this.runCommand(`git config --global user.name "${name}" `);
  }

  /**
   * Retrieves the configured Git user email.
   *
   * @returns A promise that resolves with the user's email.
   *
   * @throws Throws an error if the command fails (e.g., Git not installed or email not configured).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const email = await git.getUserEmail();
   * console.log(email); // "john.doe@example.com"
   * ```
   */
  getUserEmail() {
    return this.runCommand("git config user.email");
  }

  /**
   * Sets the global Git user email.
   *
   * This command configures the `user.email` value in the global Git configuration.
   * It wraps `git config --global user.email "<email>"`.
   *
   * @param email - The Git user email address to set.
   *
   * @returns A promise that resolves when the email has been successfully set.
   *
   * @example
   * ```ts
   * await git.setUserEmail("john.doe@example.com");
   * const email = await git.getUserEmail();
   * console.log(email); // "john.doe@example.com"
   * ```
   */
  setUserEmail(email: string) {
    return this.runCommand(`git config --global user.email "${email}"`);
  }

  /**
   * Checks if there are no **unstaged** changes in the working directory.
   *
   * @returns A promise that resolves to `true` if there are no unstaged changes, otherwise `false`.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * const clean = await git.hasNoUnstagedChanges();
   * console.log(clean); // true if working directory has no unstaged changes
   * ```
   */
  hasNoUnstagedChanges() {
    return this.tryCommand(() => this.runCommand("git diff --quiet"));
  }

  /**
   * Checks if there are no **staged but uncommitted** changes.
   *
   * @returns A promise that resolves to `true` if there are no staged changes, otherwise `false`.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * const clean = await git.hasNoStagedChanges();
   * console.log(clean); // true if nothing is staged for commit
   * ```
   */
  hasNoStagedChanges() {
    return this.tryCommand(() => this.runCommand("git diff --cached --quiet"));
  }

  /**
   * Checks if the working directory is completely clean i.e., no staged or unstaged changes.
   *
   * @returns A promise that resolves to `true` if the working directory is fully clean, otherwise `false`.
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
  async isWorkingDirClean() {
    const unstagedClean = await this.hasNoUnstagedChanges();
    const stagedClean = await this.hasNoStagedChanges();
    return unstagedClean && stagedClean;
  }

  /**
   * Checks if the current branch has an upstream branch configured.
   *
   * @returns A promise that resolves to `true` if an upstream branch is set, `false` otherwise.
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const hasUpstream = await git.hasUpstreamBranch();
   * console.log(hasUpstream); // true (if upstream is set), false (if not)
   * ```
   */
  hasUpstreamBranch() {
    return this.tryCommand(() =>
      this.runCommand("git rev-parse --abbrev-ref --symbolic-full-name @{u}"),
    );
  }

  /**
   * Retrieves the name of the current branch.
   *
   * @returns A promise that resolves with the current branch name.
   *
   * @throws Throws an error if the command fails (e.g., not a Git repository).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const branch = await git.getCurrentBranchName();
   * console.log(branch); // "main"
   * ```
   */
  getCurrentBranchName() {
    return this.runCommand("git rev-parse --abbrev-ref HEAD");
  }

  /**
   * Retrieves the default branch name of the repository (e.g., `main` or `master`).
   *
   * Falls back to "main" if the default branch cannot be determined.
   *
   * @returns A promise that resolves with the default branch name.
   *
   * @throws Throws an error if the command fails (e.g., not a Git repository).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/path/to/repo" });
   * const defaultBranch = await git.getDefaultBranchName();
   * console.log(defaultBranch); // "main" or "master"
   * ```
   */
  getDefaultBranchName = async () => {
    const branches = await this.runCommand("git branch -r");
    const defaultBranch = branches
      .split("\n")
      .find((branch) => branch.includes("origin/HEAD"));
    return defaultBranch
      ? defaultBranch.replace("origin/HEAD -> origin/", "").trim()
      : "main";
  };

  /**
   * Stages one or more files or directories for the next commit.
   *
   * This method wraps `git add` to prepare specified files or directories for commit.
   * You can provide a single path or an array of paths. By default, it stages all changes.
   *
   * @param path - The file(s) or directory path(s) to stage.
   * Use `"."` to stage all changes. If an array is provided, all listed paths will be staged.
   *
   * @returns A promise that resolves with the command's stdout if successful.
   *
   * @throws Throws an error with stderr if the command fails (e.g., invalid path).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * await git.add("README.md"); // stages a single file
   * await git.add(["src/", "docs/"]); // stages multiple directories
   * await git.add(); // stages everything (default ".")
   * ```
   */
  add(path: string | string[] = ".") {
    const normalizedPath = Array.isArray(path) ? path.join(" ") : path;
    return this.runCommand(`git add ${normalizedPath} `);
  }

  /**
   * Resets the current HEAD to the specified commit hash, with an optional behavior flag.
   *
   * This method wraps `git reset <hash> <flag>` and moves the current branch pointer to the given commit.
   * It does not modify the working directory or the index unless additional flags (e.g., `--hard`, `--soft`) are added manually.
   *
   * @param hashValue - The target commit hash to reset to.
   * This must be a valid Git commit SHA (full or abbreviated).
   *
   * @param flag - One or more Git reset flags.
   * Examples: `"--soft"`, `"--hard"`.
   *
   *
   * @returns A promise that resolves with the command's stdout if the reset succeeds.
   *
   * @throws Throws an error if the command fails (e.g., invalid hash or detached HEAD issues).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * await git.reset("abc1234"); // Moves HEAD to commit abc1234
   * await git.reset("abc1234", "--hard"); // Hard reset to commit
   * ```
   */
  reset(hashValue: string, flag?: ResetFlag) {
    const parts = ["git reset", flag, hashValue].filter(Boolean);
    return this.runCommand(parts.join(" "));
  }

  /**
   * Restores working tree files from the index or a specified source.
   *
   * This method wraps `git restore` to unstage files or restore their contents
   * from the index (staged) or from a specific commit/branch.
   *
   * @param target - One or more file paths to restore.
   * Use `"."` to restore all tracked files. When using an array, all paths will be included.
   *
   * @param flag - An optional Git restore flag like `--staged` or `--source=<commit>`.
   * Use this to restore from a specific source or unstage changes.
   *
   * @returns A promise that resolves with the command's output on success.
   *
   * @throws Throws an error if the command fails (e.g., invalid path or ref).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * await git.restore("README.md"); // Restore file from index
   * await git.restore(".", "--staged"); // Unstage all changes
   * await git.restore(["src/", "docs/"], "--source=HEAD~1"); // Restore from previous commit
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-restore | git restore - Official Git Docs}
   */
  restore(target: string | string[] = ".", flag?: RestoreFlag) {
    const normalizedTarget = Array.isArray(target) ? target.join(" ") : target;
    const flagPart = flag ? ` ${flag}` : "";
    return this.runCommand(`git restore${flagPart} ${normalizedTarget}`);
  }

  /**
   * Commits staged changes to the repository with a custom message and optional flags.
   *
   * This method wraps `git commit -m "<message>"` with support for additional commit flags.
   * It safely escapes double quotes in the commit message to avoid shell issues.
   *
   * @param message - The commit message to use. Will be wrapped in quotes and escaped.
   * @param flags - Optional list of commit flags to customize the commit behavior.
   * Each flag must be a valid `CommitFlag` value.
   *
   * @returns A promise that resolves with the command's stdout if the commit succeeds.
   *
   * @throws Throws an error if the commit fails (e.g., nothing staged, invalid flags).
   *
   * @example
   * ```ts
   * const git = new Git({ cwd: "/repo" });
   * await git.commit("feat: add login API");
   * await git.commit("fix: typo", ["--amend", "--no-edit"]);
   * ```
   *
   * @see {@link CommitFlag} for supported commit flags
   * @see {@link https://git-scm.com/docs/git-commit Git Commit Docs}
   */
  async commit(message: string, flags?: CommitFlag | CommitFlag[]) {
    const flagsPart = flags
      ? Array.isArray(flags)
        ? ` ${flags.join(" ")}`
        : ` ${flags}`
      : "";

    await this.runCommand(
      `git commit -m "${message.replace(/"/g, '\\"')}"${flagsPart}`,
    );
    return this;
  }

  /**
   * Initializes a new Git repository in the working directory.
   *
   * @returns A promise that resolves to the Git instance.
   *
   * @example
   * ```ts
   * await git.init();
   * await git.clone("https://github.com/repo.git");
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-init Git Init Docs}
   */
  async init() {
    await this.runCommand("git init");
    return this;
  }

  /**
   * Clones a Git repository into the current directory or specified folder.
   *
   * @param url - The Git repository URL to clone.
   * @param dir - Optional directory to clone into.
   *
   * @returns A promise that resolves to the Git instance.
   *
   * @example
   * ```ts
   * await git.clone("https://github.com/user/repo.git", "my-folder");
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-clone Git Clone Docs}
   */
  async clone(url: string, dir: string = "") {
    await this.runCommand(`git clone ${url} ${dir}`);
    return this;
  }

  /**
   * Pushes changes to the specified remote and optionally to a specific branch.
   *
   * @param remote The remote name to push to. Defaults to `"origin"`.
   * @param branch The branch name to push. If not provided, pushes all matching branches.
   * @param flags Optional push flags to customize behavior. Can be a single flag or array.
   *
   * @returns A promise that resolves with the result of the Git command.
   *
   * @example
   * ```ts
   * git.push(); // git push origin
   * git.push("origin", "main", "--force"); // git push --force origin main
   * git.push("origin", "dev", ["--tags", "--set-upstream"]); // git push --tags --set-upstream origin dev
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-push Git Push Docs}
   */
  async push(
    remote: string | PushFlag[] = "origin",
    branch = "",
    flags: PushFlag | PushFlag[] = [],
  ) {
    let finalRemote = "origin";
    let finalBranch = "";
    let finalFlags: PushFlag[] = [];

    if (Array.isArray(remote)) {
      finalFlags = remote;
    } else {
      finalRemote = remote;
      if (Array.isArray(branch)) {
        finalFlags = branch;
      } else {
        finalBranch = branch;
        finalFlags = Array.isArray(flags) ? flags : [flags].filter(Boolean);
      }
    }

    const flagStr = finalFlags.length ? `${finalFlags.join(" ")} ` : "";
    const branchRef = finalBranch
      ? `${finalRemote} ${finalBranch}`
      : finalRemote;

    await this.runCommand(`git push ${flagStr}${branchRef}`);
    return this;
  }

  /**
   * Creates, deletes, or lists Git tags with optional flags.
   *
   * @param value The tag name (or value depending on flags).
   * @param flags Optional tag flags like `--annotate`, `--delete`, etc.
   *
   * @returns A promise that resolves with the result of the Git command.
   *
   * @example
   * ```ts
   * git.tag("v1.0.0"); // git tag v1.0.0
   * git.tag("v1.0.0", "--delete"); // git tag --delete v1.0.0
   * git.tag("v1.0.0", ["--annotate", "--force"]); // git tag --annotate --force v1.0.0
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-tag Git Tag Docs}
   */
  tag(value: string, flags?: TagFlag | TagFlag[]) {
    const flagStr = flags
      ? Array.isArray(flags)
        ? `${flags.join(" ")} `
        : `${flags} `
      : "";
    return this.runCommand(`git tag ${flagStr}${value}`);
  }

  /**
   * Merges the specified branch into the current branch.
   *
   * @param branchName The name of the branch to merge.
   * @param flags Optional merge flags like `--no-ff`, `--squash`, etc.
   *
   * @returns A promise that resolves with the result of the Git command.
   *
   * @example
   * ```ts
   * git.merge("feature-branch"); // git merge feature-branch
   * git.merge("hotfix", ["--squash", "--no-commit"]); // git merge --squash --no-commit hotfix
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-merge Git Merge Docs}
   */
  merge(branchName: string, flags?: MergeFlag | MergeFlag[]) {
    const flagStr = flags
      ? Array.isArray(flags)
        ? `${flags.join(" ")} `
        : `${flags} `
      : "";
    return this.runCommand(`git merge ${flagStr}${branchName}`);
  }

  /**
   * Switches to the given branch or commit, optionally creating it.
   *
   * @param target The branch, tag, or commit hash to checkout.
   * @param flags Optional checkout flags like `-b`, `--orphan`, etc.
   *
   * @returns A promise that resolves with the result of the Git command.
   *
   * @example
   * ```ts
   * git.checkout("main"); // git checkout main
   * git.checkout("new-branch", "-b"); // git checkout -b new-branch
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-checkout Git Checkout Docs}
   */
  async checkout(target: string, flags?: CheckoutFlag | CheckoutFlag[]) {
    const flagStr = flags
      ? Array.isArray(flags)
        ? `${flags.join(" ")} `
        : `${flags} `
      : "";
    await this.runCommand(`git checkout ${flagStr}${target}`);
    return this;
  }

  /**
   * Creates, deletes, renames, or lists branches.
   *
   * @param name Optional branch name. Required for some flags.
   * @param flags Optional branch flags like `-d`, `-m`, `--list`, etc.
   *
   * @returns A promise that resolves with the result of the Git command.
   *
   * @example
   * ```ts
   * git.branch(); // git branch
   * git.branch("feature-x"); // git branch feature-x
   * git.branch("old-branch", ["-d"]); // git branch -d old-branch
   * git.branch(undefined, "--show-current"); // git branch --show-current
   * ```
   *
   * @see {@link https://git-scm.com/docs/git-branch Git Branch Docs}
   */
  branch(name?: string, flags: BranchFlag | BranchFlag[] = []) {
    const flagArr = Array.isArray(flags) ? flags : flags ? [flags] : [];
    const parts = ["git branch", ...flagArr, name].filter(Boolean);
    return this.runCommand(parts.join(" "));
  }
}
