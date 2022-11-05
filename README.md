# CodSpeed Action

Github Actions for running CodSpeed in the CI.

# Usage

```yaml
- uses: CodSpeedHQ/action@v1
  with:
    # [REQUIRED] the CodSpeed upload token: can be found at https://codspeed.com/settings
    # You can then use the token as a secret in your repository
    token: ${{ secrets.CODSPEED_TOKEN }}

    # [REQUIRED] The command used to run your codspeed benchmarks
    # Here with pytest:
    run: pytest tests/ --benchmark

    # [OPTIONAL]: A custom upload url, if you are using a self-hosted CodSpeed instance
    upload_url: ""
```

# Example workflows running CodSpeed

## With pytest

```yaml
name: benchmarks

on:
  push:
    branches:
      - "master"
  pull_request:

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v3
      - run: pip install -r requirements.txt
      - uses: CodSpeedHQ/action-@v1
        with:
          token: ${{ secrets.CODSPEED_TOKEN }}
          run: pytest tests/ # the action will make sure to run only the benchmarks
```
