<div align="center">

# GitNifty

_A robust, promise-based Git utility for Node.js_

[![Build](https://github.com/teneplaysofficial/gitnifty/actions/workflows/release.yml/badge.svg)](https://github.com/TenEplaysOfficial/gitnifty)
[![npm version](https://img.shields.io/npm/v/gitnifty.svg)](https://www.npmjs.com/package/gitnifty)
[![JSR](https://jsr.io/badges/@tene/gitnifty)](https://jsr.io/@tene/gitnifty)
[![JSR Score](https://jsr.io/badges/@tene/gitnifty/score)](https://jsr.io/@tene/gitnifty)
[![License](https://img.shields.io/github/license/TenEplaysOfficial/gitnifty.svg)](https://github.com/TenEplaysOfficial/gitnifty/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/TenEplaysOfficial/gitnifty?style=flat)](https://github.com/TenEplaysOfficial/gitnifty/stargazers)
[![Downloads](https://img.shields.io/npm/dm/gitnifty)](https://www.npmjs.com/package/gitnifty)
[![Type Support](https://img.shields.io/badge/type-support-blue)](https://github.com/TenEplaysOfficial/gitnifty)
[![Sponsor](https://img.shields.io/badge/funding-sponsor-yellow)](https://github.com/sponsors/TenEplaysOfficial)
[![Follow @teneplays on X](https://img.shields.io/badge/follow-@teneplays-fff?logo=x)](https://x.com/teneplays)

</div>

**GitNifty** is a robust and promise-based Git utility for Node.js, offering developers smart, automation-ready commands for common Git operations. Ideal for building CLI tools, automation scripts, or custom Git workflows, GitNifty streamlines your Git interaction without complex shell scripting.

> Elevate your Git game with tools that are as delightful as they are effective.

Built with TypeScript and powered by `child_process.exec`, GitNifty offers clean abstractions for Git commands while maintaining full control and flexibility.

## Installation

```sh
yarn add gitnifty
# or
npm install gitnifty
```

## Features

- **Smart Commands** - Get common Git info without writing raw shell logic.
- **Promise-based** - Easy async integration with modern toolchains.
- **Error-resilient** - Graceful handling for missing remotes or configs.
- **Automation-ready** - Perfect for CLI tools, devops, and build scripts.
- **Zero dependencies** - Lightweight and focused.
- **TypeScript Support** - Fully typed API for better DX.

## Usage

GitNifty exposes a `Git` class that can be used to interact with a Git repository via common commands like `user`, `currentBranch`, `checkWorkingDirClean`, and more.

### Basic Example

```ts
import { Git } from "gitnifty";

const git = new Git({ cwd: "/path/to/your/repo" });

const username = await git.getUserName(); // e.g., 'John Doe'
const branch = await git.getCurrentBranchName(); // e.g., 'main'
const isClean = await git.isWorkingDirClean(); // true or false
```

### Async Usage

```ts
async function main() {
  const git = new Git();
  const userName = await git.getUserName();
  console.log("Git User:", userName);
}

main();
```

## API

You can view the complete API reference [here](https://TenEplaysOfficial.github.io/gitnifty).

## Requirements

- Node.js v18+
- Git installed and available in PATH
- TypeScript (optional but supported)

## FAQ

<details>
<summary>Does it work outside of Git repositories?</summary>
Some commands require a valid Git repository (.git folder). Others like git config may still work.
</details>

<details>
<summary>Can I use this in a CLI tool?</summary>
Yes! GitNifty is designed for CLI automation. You can use it in commander, yargs, or any script-based tool.
</details>

<details>
<summary>Does it support Git hooks or events?</summary>
Coming soon! GitNifty will support basic hook helpers and lifecycle execution.
</details>

## License

Released under the [Apache License](LICENSE)
