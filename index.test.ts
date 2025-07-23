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

      await expect(git.getUserName()).rejects.toContain(errorMessage);
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

      await expect(git.getUserEmail()).rejects.toContain(errorMessage);
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

      await expect(git.getCurrentBranchName()).rejects.toContain(errorMessage);
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

      await expect(git.getDefaultBranchName()).rejects.toContain(errorMessage);
    });
  });
});
