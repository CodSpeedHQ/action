# Changelog

<sub>
The format is based on <a href="https://keepachangelog.com/en/1.0.0/">Keep a Changelog</a>,
and this project adheres to <a href="https://semver.org/spec/v2.0.0.html">Semantic Versioning</a>.
</sub>

## [Unreleased]

## [2.2.0] - 2024-02-22

- feat: upload execution logs to ease debugging, see https://github.com/CodSpeedHQ/runner/pull/14

## [2.1.1] - 2024-02-02

- feat: integrate the mongodb instrument, see https://github.com/CodSpeedHQ/runner/pull/9
- fix(instruments): use IP address instead of localhost for MongoDB URI, see https://github.com/CodSpeedHQ/runner/pull/13

## [2.0.3] - 2024-01-04

- fix: bump cargo-dist to remove broken pipe logs, see https://github.com/CodSpeedHQ/runner/pull/12
- fix(uploader): handle error response when retrieving upload data, see https://github.com/CodSpeedHQ/runner/pull/11

## [2.0.2] - 2023-12-04

- fix: control the environment when running `cargo-codspeed`, see https://github.com/CodSpeedHQ/runner/pull/8

## [2.0.1] - 2023-12-01

- feat: simplify action output

## [2.0.0] - 2023-12-01

### Breaking changes

- `upload_url` input is now `upload-url`
- `pytest-codspeed` is no longer installed automatically by this action
