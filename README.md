<div align="center">
<h1>CodSpeed Action</h1>

[![CI](https://github.com/CodSpeedHQ/action/actions/workflows/ci.yml/badge.svg)](https://github.com/CodSpeedHQ/action/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/CodSpeedHQ/action)](https://github.com/CodSpeedHQ/action/releases)

Github Actions for running CodSpeed in your CI.

</div>

# Usage

```yaml
- uses: CodSpeedHQ/action@v1
  with:
    # [REQUIRED for private repositories]
    # The CodSpeed upload token: can be found at https://codspeed.io/settings
    # It's strongly recommended to use a secret for this value
    # If you're instrumenting a public repository, you can omit this value
    token: ""

    # [REQUIRED]
    # The command used to run your codspeed benchmarks
    run: ""

    # [OPTIONAL]
    # A custom upload url, only if you are using an on premise CodSpeed instance
    upload_url: ""
```

# Example usage

## With `pytest` and [`pytest-codspeed`](https://github.com/CodSpeedHQ/pytest-codspeed)

This worklow will run the benchmarks found in the `tests/` folder and upload the results to CodSpeed.

It will be triggered on every push to the `main` branch and on every pull request.

```yaml
name: codspeed-benchmarks

on:
  push:
    branches:
      - "main" # or "master"
  pull_request:
  # `workflow_dispatch` allows CodSpeed to trigger backtest
  # performance analysis in order to generate initial data.
  workflow_dispatch:

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v3
        with:
          python-version: "3.9"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run benchmarks
        uses: CodSpeedHQ/action@v1
        with:
          token: ${{ secrets.CODSPEED_TOKEN }}
          run: pytest tests/ --codspeed
```
