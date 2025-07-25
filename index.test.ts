import { exec } from "node:child_process";
import type { ExecException, ChildProcess } from "node:child_process";
import { Git } from "./index";
import type { GitOptions } from "./index";

jest.mock("node:child_process", () => ({
  exec: jest.fn(),
}));

const mockedExec = exec as unknown as jest.Mock;

type MockExecOptions = {
  stdout?: string;
  stderr?: string;
  error?: ExecException | null;
};

const mockExec = ({
  stdout = "",
  stderr = "",
  error = null,
}: MockExecOptions = {}): void => {
  mockedExec.mockImplementation((_cmd, _options, callback) => {
    if (callback) {
      callback(error, stdout, stderr);
    }
    return {
      on: jest.fn(),
      kill: jest.fn(),
      pid: 1234,
    } as unknown as ChildProcess;
  });
};

describe("Git", () => {
  let git: Git;
  const defaultCwd = process.cwd();
  const customCwd = "/path/to/repo";

  beforeEach(() => {
    jest.clearAllMocks();
    git = new Git({ cwd: customCwd });
  });

  describe("constructor", () => {
    it("should set cwd to provided value", () => {
      expect((git as unknown as GitOptions).cwd).toBe(customCwd);
    });

    it("should default cwd to process.cwd() if not provided", () => {
      const gitDefault = new Git({});
      expect((gitDefault as unknown as GitOptions).cwd).toBe(defaultCwd);
    });
  });

  describe("getUserName", () => {
    it("should return the Git user name", async () => {
      const username = "John Doe";
      mockExec({ stdout: username });

      const result = await git.getUserName();
      expect(result).toBe(username);
      expect(mockedExec).toHaveBeenCalledWith(
        "git config user.name",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should throw an error if the command fails", async () => {
      const errorMessage = "Git not installed";
      mockExec({
        error: { message: errorMessage } as ExecException,
        stderr: "Error: Git not installed",
      });

      await expect(git.getUserName()).rejects.toThrow(errorMessage);
    });
  });

  describe("getUserEmail", () => {
    it("should return the Git user email", async () => {
      const email = "john.doe@example.com";
      mockExec({ stdout: email });

      const result = await git.getUserEmail();
      expect(result).toBe(email);
      expect(mockedExec).toHaveBeenCalledWith(
        "git config user.email",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should throw an error if the command fails", async () => {
      const errorMessage = "Email not configured";
      mockExec({
        error: { message: errorMessage } as ExecException,
        stderr: "Error: Email not configured",
      });

      await expect(git.getUserEmail()).rejects.toThrow(errorMessage);
    });
  });

  describe("setUserName", () => {
    it("should configure the user name globally", async () => {
      mockExec({ stdout: "" });
      await git.setUserName("Jane Doe");
      expect(mockedExec).toHaveBeenCalledWith(
        'git config --global user.name "Jane Doe" ',
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("setUserEmail", () => {
    it("should configure the user email globally", async () => {
      mockExec({ stdout: "" });
      await git.setUserEmail("jane@example.com");
      expect(mockedExec).toHaveBeenCalledWith(
        'git config --global user.email "jane@example.com"',
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("hasNoUnstagedChanges", () => {
    it("should return true if no unstaged changes", async () => {
      mockExec({ stdout: "" });

      const result = await git.hasNoUnstagedChanges();
      expect(result).toBe(true);
      expect(mockedExec).toHaveBeenCalledWith(
        "git diff --quiet",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should return false if unstaged changes exist", async () => {
      mockExec({ error: { message: "Unstaged changes" } as ExecException });

      const result = await git.hasNoUnstagedChanges();
      expect(result).toBe(false);
    });
  });

  describe("hasNoStagedChanges", () => {
    it("should return true if no staged changes", async () => {
      mockExec({ stdout: "" });

      const result = await git.hasNoStagedChanges();
      expect(result).toBe(true);
      expect(mockedExec).toHaveBeenCalledWith(
        "git diff --cached --quiet",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should return false if staged changes exist", async () => {
      mockExec({ error: { message: "Staged changes" } as ExecException });

      const result = await git.hasNoStagedChanges();
      expect(result).toBe(false);
    });
  });

  describe("isWorkingDirClean", () => {
    it("should return true if both staged and unstaged changes are clean", async () => {
      mockExec({ stdout: "" });

      const result = await git.isWorkingDirClean();
      expect(result).toBe(true);
      expect(mockedExec).toHaveBeenCalledTimes(2);
    });

    it("should return false if unstaged changes exist", async () => {
      mockExec({ error: { message: "Unstaged changes" } as ExecException });

      const result = await git.isWorkingDirClean();
      expect(result).toBe(false);
    });

    it("should return false if staged changes exist", async () => {
      // Mock first call (unstaged) to succeed, second call (staged) to fail
      mockedExec
        .mockImplementationOnce((_cmd, _options, callback) => {
          if (callback) callback(null, "", "");
          return {
            on: jest.fn(),
            kill: jest.fn(),
            pid: 1234,
          } as unknown as ChildProcess;
        })
        .mockImplementationOnce((_cmd, _options, callback) => {
          if (callback)
            callback({ message: "Staged changes" } as ExecException, "", "");
          return {
            on: jest.fn(),
            kill: jest.fn(),
            pid: 1234,
          } as unknown as ChildProcess;
        });

      const result = await git.isWorkingDirClean();
      expect(result).toBe(false);
    });
  });

  describe("hasUpstreamBranch", () => {
    it("should return true if upstream branch is set", async () => {
      mockExec({ stdout: "origin/main" });

      const result = await git.hasUpstreamBranch();
      expect(result).toBe(true);
      expect(mockedExec).toHaveBeenCalledWith(
        "git rev-parse --abbrev-ref --symbolic-full-name @{u}",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should return false if no upstream branch is set", async () => {
      mockExec({ error: { message: "No upstream" } as ExecException });

      const result = await git.hasUpstreamBranch();
      expect(result).toBe(false);
    });
  });

  describe("getCurrentBranchName", () => {
    it("should return the current branch name", async () => {
      const branchName = "main";
      mockExec({ stdout: branchName });

      const result = await git.getCurrentBranchName();
      expect(result).toBe(branchName);
      expect(mockedExec).toHaveBeenCalledWith(
        "git rev-parse --abbrev-ref HEAD",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should throw an error if the command fails", async () => {
      const errorMessage = "Not a Git repository";
      mockExec({
        error: { message: errorMessage } as ExecException,
        stderr: "Error: Not a Git repository",
      });

      await expect(git.getCurrentBranchName()).rejects.toThrow(errorMessage);
    });
  });

  describe("getDefaultBranchName", () => {
    it("should return the default branch name", async () => {
      const defaultBranch = "origin/HEAD -> origin/main";
      mockExec({ stdout: defaultBranch });

      const result = await git.getDefaultBranchName();
      expect(result).toBe("main");
      expect(mockedExec).toHaveBeenCalledWith(
        "git branch -r",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should return 'main' if default branch cannot be determined", async () => {
      mockExec({ stdout: "" });

      const result = await git.getDefaultBranchName();
      expect(result).toBe("main");
    });

    it("should throw an error if the command fails", async () => {
      const errorMessage = "Not a Git repository";
      mockExec({
        error: { message: errorMessage } as ExecException,
        stderr: "Error: Not a Git repository",
      });

      await expect(git.getDefaultBranchName()).rejects.toThrow(errorMessage);
    });
  });

  describe("add", () => {
    it("should stage a single file", async () => {
      mockExec({ stdout: "success" });

      const result = await git.add("README.md");
      expect(result).toBe("success");
      expect(mockedExec).toHaveBeenCalledWith(
        "git add README.md ",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should stage multiple paths", async () => {
      mockExec({ stdout: "success" });

      await git.add(["src/", "docs/"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git add src/ docs/ ",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should default to staging all files", async () => {
      mockExec({ stdout: "all staged" });

      const result = await git.add();
      expect(result).toBe("all staged");
      expect(mockedExec).toHaveBeenCalledWith(
        "git add . ",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("reset", () => {
    it("should reset to a commit without flags", async () => {
      mockExec({ stdout: "reset done" });

      const result = await git.reset("abc123");
      expect(result).toBe("reset done");
      expect(mockedExec).toHaveBeenCalledWith(
        "git reset abc123",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should reset with a flag", async () => {
      mockExec({ stdout: "hard reset" });

      await git.reset("abc123", "--hard");
      expect(mockedExec).toHaveBeenCalledWith(
        "git reset --hard abc123",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("restore", () => {
    it("should restore a single file", async () => {
      mockExec({ stdout: "restored" });

      const result = await git.restore("file.txt");
      expect(result).toBe("restored");
      expect(mockedExec).toHaveBeenCalledWith(
        "git restore file.txt",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should restore with a flag", async () => {
      mockExec({ stdout: "unstaged" });

      await git.restore(".", "--staged");
      expect(mockedExec).toHaveBeenCalledWith(
        "git restore --staged .",
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should restore multiple paths with flag", async () => {
      mockExec({ stdout: "restored multiple" });

      await git.restore(["src/", "docs/"], "--source=HEAD~1");
      expect(mockedExec).toHaveBeenCalledWith(
        "git restore --source=HEAD~1 src/ docs/",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("commit", () => {
    it("should commit with a message only", async () => {
      mockExec({ stdout: "committed" });

      const result = await git.commit("feat: add feature");
      expect(result).toBe(git);
      expect(mockedExec).toHaveBeenCalledWith(
        'git commit -m "feat: add feature"',
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should commit with message containing double quotes", async () => {
      mockExec({ stdout: "escaped commit" });

      await git.commit('fix: escape "quotes"');
      expect(mockedExec).toHaveBeenCalledWith(
        'git commit -m "fix: escape \\"quotes\\""',
        { cwd: customCwd },
        expect.any(Function),
      );
    });

    it("should commit with multiple flags", async () => {
      mockExec({ stdout: "amended" });

      await git.commit("fix: typo", ["--amend", "--no-edit"]);
      expect(mockedExec).toHaveBeenCalledWith(
        'git commit -m "fix: typo" --amend --no-edit',
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("init", () => {
    it("should initialize a new Git repository", async () => {
      mockExec({ stdout: "Initialized empty Git repository" });
      const result = await git.init();
      expect(mockedExec).toHaveBeenCalledWith(
        "git init",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe(git);
    });
  });

  describe("clone", () => {
    it("should clone a repository into a directory", async () => {
      mockExec({ stdout: "Cloning into 'repo'..." });
      const result = await git.clone(
        "https://github.com/example/repo.git",
        "repo",
      );
      expect(mockedExec).toHaveBeenCalledWith(
        "git clone https://github.com/example/repo.git repo",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe(git);
    });

    it("should clone a repository into current directory if no dir is specified", async () => {
      mockExec({ stdout: "Cloning into '.'..." });
      await git.clone("https://github.com/example/repo.git");
      expect(mockedExec).toHaveBeenCalledWith(
        "git clone https://github.com/example/repo.git ",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("push", () => {
    it("should push to the default remote", async () => {
      mockExec({ stdout: "pushed" });

      const result = await git.push();
      expect(mockedExec).toHaveBeenCalledWith(
        "git push origin",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe(git);
    });

    it("should push with flags", async () => {
      mockExec({ stdout: "pushed with force" });

      await git.push(["--force", "--tags"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git push --force --tags origin",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("tag", () => {
    it("should create a new tag", async () => {
      mockExec({ stdout: "tagged" });

      const result = await git.tag("v1.0.0");
      expect(mockedExec).toHaveBeenCalledWith(
        "git tag v1.0.0",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe("tagged");
    });

    it("should create annotated tag with force", async () => {
      mockExec({ stdout: "annotated tag" });

      await git.tag("v1.0.0", ["--annotate", "--force"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git tag --annotate --force v1.0.0",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("merge", () => {
    it("should merge a branch", async () => {
      mockExec({ stdout: "merged" });

      const result = await git.merge("feature-branch");
      expect(mockedExec).toHaveBeenCalledWith(
        "git merge feature-branch",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe("merged");
    });

    it("should merge with flags", async () => {
      mockExec({ stdout: "merged no-ff" });

      await git.merge("dev", ["--no-ff", "--edit"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git merge --no-ff --edit dev",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("checkout", () => {
    it("should checkout a branch", async () => {
      mockExec({ stdout: "checked out" });

      const result = await git.checkout("main");
      expect(mockedExec).toHaveBeenCalledWith(
        "git checkout main",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe(git);
    });

    it("should checkout with flags", async () => {
      mockExec({ stdout: "checked out with orphan" });

      await git.checkout("gh-pages", ["--orphan"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git checkout --orphan gh-pages",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });

  describe("branch", () => {
    it("should create a branch", async () => {
      mockExec({ stdout: "branch created" });

      const result = await git.branch("new-feature");
      expect(mockedExec).toHaveBeenCalledWith(
        "git branch new-feature",
        { cwd: customCwd },
        expect.any(Function),
      );
      expect(result).toBe("branch created");
    });

    it("should delete a branch with flags", async () => {
      mockExec({ stdout: "deleted branch" });

      await git.branch("bugfix", ["-D"]);
      expect(mockedExec).toHaveBeenCalledWith(
        "git branch -D bugfix",
        { cwd: customCwd },
        expect.any(Function),
      );
    });
  });
});
