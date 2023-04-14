import {exec} from "@actions/exec";

const MIN_VALGRIND_VERSION = [3, 16, 0]; // Below 3.16.0, --collect-systime=nsec is not supported

export const checkValgrindVersion = async (): Promise<void> => {
  let versionOutput = "";
  try {
    await exec("valgrind", ["--version"], {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          versionOutput += data.toString();
        },
      },
    });
  } catch (error) {
    throw new Error("valgrind is not installed");
  }
  versionOutput = versionOutput.trim();
  const version = parseValgrindVersion(versionOutput);
  if (!isVersionValid(version)) {
    throw new Error(
      `valgrind version ${version.join(
        "."
      )} is not supported, please upgrade to at least ${MIN_VALGRIND_VERSION.join(
        "."
      )}. Upgrading to Ubuntu 22.04+ will allow you to have a valid version.`
    );
  }
};

export const parseValgrindVersion = (versionOutput: string): number[] => {
  // versionOutput is something like "valgrind-3.16.0"
  const versionString = versionOutput.match(/valgrind-(.*)/)?.[1];
  if (!versionString) {
    throw new Error("Failed to get valgrind version");
  }
  const version = versionString.split(".").map(Number);
  if (version.length !== 3) {
    throw new Error(`valgrind version ${versionString} is not valid`);
  }
  return version;
};

export const isVersionValid = (version: number[]): boolean =>
  version[0] >= MIN_VALGRIND_VERSION[0] &&
  (version[0] > MIN_VALGRIND_VERSION[0] ||
    version[1] >= MIN_VALGRIND_VERSION[1]) &&
  (version[0] > MIN_VALGRIND_VERSION[0] ||
    version[1] > MIN_VALGRIND_VERSION[1] ||
    version[2] >= MIN_VALGRIND_VERSION[2]);
