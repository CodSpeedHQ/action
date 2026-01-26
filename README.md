<div align="center">
<h1>CodSpeed Action</h1>

[![CI](https://github.com/CodSpeedHQ/action/actions/workflows/ci.yml/badge.svg)](https://github.com/CodSpeedHQ/action/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/CodSpeedHQ/action)](https://github.com/CodSpeedHQ/action/releases)
[![Discord](https://img.shields.io/badge/chat%20on-discord-7289da.svg)](https://discord.com/invite/MxpaCfKSqF)

GitHub Actions for running [CodSpeed](https://codspeed.io) in your CI.

</div>

# Usage

```yaml
- uses: CodSpeedHQ/action@v4
  with:
    # [OPTIONAL]
    # The command used to run your CodSpeed benchmarks
    #
    # Leave empty to use targets defined in your project configuration (e.g `codspeed.yml`)
    # https://codspeed.io/docs/cli#configuration
    # ⚠️ WARNING: for action/runner versions lower than v4.9.0, this parameter is required.
    run: "<YOUR_COMMAND>"

    # [REQUIRED]
    # The measurement mode to use: "simulation" (recommended), or "walltime".
    # More details on the instruments at https://docs.codspeed.io/instruments/
    mode: "simulation"

    # [OPTIONAL]
    # CodSpeed recommends using OpenID Connect (OIDC) for authentication.
    #
    # If you are not using OpenID Connect, set the CodSpeed upload token
    # that can be found at https://codspeed.io/<org>/<repo>/settings
    # It's strongly recommended to use a secret for this value
    # If you're instrumenting a public repository, you can omit this value altogether
    #
    # More information in the CodSpeed documentation:
    # https://codspeed.io/docs/integrations/ci/github-actions#authentication
    token: ""

    # [OPTIONAL]
    # The directory where the `run` command will be executed.
    # ⚠️ WARNING: if you use `defaults.run.working-directory`, you must still set this parameter.
    working-directory: ""

    # [OPTIONAL]
    # Path to a CodSpeed configuration file (codspeed.yml).
    # If not specified, the runner will look for a codspeed.yml file in the repository root.
    config: ""

    # [OPTIONAL]
    # Comma-separated list of instruments to enable. Possible values: mongodb.
    instruments: ""

    # [OPTIONAL]
    # The name of the environment variable that contains the MongoDB URI to patch.
    # If not provided, user will have to provide it dynamically through a CodSpeed integration.
    # Only used if the `mongodb` instrument is enabled.
    mongo_uri_env_name: ""

    # [OPTIONAL]
    # Enable caching of instrument installations (like valgrind or perf) to speed up
    # subsequent workflow runs. Set to 'false' to disable caching. Defaults to 'true'.
    cache-instruments: "true"

    # [OPTIONAL]
    # The directory to use for caching installations of instruments (like valgrind or perf).
    # This will speed up subsequent workflow runs by reusing previously installed instruments.
    # Defaults to $HOME/.cache/codspeed-action if not specified.
    instruments-cache-dir: ""

    # [OPTIONAL]
    # A custom upload url, only if you are using an on premise CodSpeed instance
    upload-url: ""

    # [OPTIONAL]
    # The version of the go-runner to use (e.g., 1.0.0, 1.0.0-beta.1). If not specified, the latest version will be installed
    go-runner-version: ""
```

# Example usage

## Python with `pytest` and [`pytest-codspeed`](https://github.com/CodSpeedHQ/pytest-codspeed)

This workflow will run the benchmarks found in the `tests/` folder and upload the results to CodSpeed.

It will be triggered on every push to the `main` branch and on every pull request.

```yaml
name: CodSpeed

on:
  push:
    branches:
      - "main" # or "master"
  pull_request: # required to have reports on PRs
  # `workflow_dispatch` allows CodSpeed to trigger backtest
  # performance analysis in order to generate initial data.
  workflow_dispatch:

jobs:
  benchmarks:
    name: Run benchmarks
    runs-on: ubuntu-latest
    permissions: # optional for public repositories
      contents: read
      id-token: write # for OpenID Connect authentication with CodSpeed
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v3
        with:
          python-version: "3.9"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run benchmarks
        uses: CodSpeedHQ/action@v4
        with:
          mode: simulation
          run: pytest tests/ --codspeed
```

## Rust with `cargo-codspeed` and `codspeed-criterion-compat` / `codspeed-bencher-compat`

This workflow will run the benchmarks found in the `tests/` folder and upload the results to CodSpeed.

It will be triggered on every push to the `main` branch and on every pull request.

```yml
name: CodSpeed

on:
  push:
    branches:
      - "main" # or "master"
  pull_request: # required to have reports on PRs
  # `workflow_dispatch` allows CodSpeed to trigger backtest
  # performance analysis in order to generate initial data.
  workflow_dispatch:

jobs:
  name: Run benchmarks
  benchmarks:
    runs-on: ubuntu-latest
    permissions: # optional for public repositories
      contents: read
      id-token: write # for OpenID Connect authentication with CodSpeed
    steps:
      - uses: actions/checkout@v4

      - name: Setup rust toolchain, cache and cargo-codspeed binary
        uses: moonrepo/setup-rust@v0
        with:
          channel: stable
          cache-target: release
          bins: cargo-codspeed

      - name: Build the benchmark target(s)
        run: cargo codspeed build

      - name: Run the benchmarks
        uses: CodSpeedHQ/action@v4
        with:
          mode: simulation
          run: cargo codspeed run
```

## Node.js with `codspeed-node`, TypeScript and `vitest`

This workflow will run the benchmarks defined with `vitest`'s `bench` function and upload the results to CodSpeed.

It will be triggered on every push to the `main` branch and on every pull request.

```yml
name: CodSpeed

on:
  push:
    branches:
      - "main" # or "master"
  pull_request: # required to have reports on PRs
  # `workflow_dispatch` allows CodSpeed to trigger backtest
  # performance analysis in order to generate initial data.
  workflow_dispatch:

jobs:
  benchmarks:
    name: Run benchmarks
    runs-on: ubuntu-latest
    permissions: # optional for public repositories
      contents: read
      id-token: write # for OpenID Connect authentication with CodSpeed
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm install

      - name: Run benchmarks
        uses: CodSpeedHQ/action@v4
        with:
          mode: simulation
          run: npx vitest bench
```
