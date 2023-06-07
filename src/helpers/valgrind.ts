import {exec} from "@actions/exec";

const MIN_VALGRIND_VERSION: ValgrindVersion = {major: 3, minor: 16, patch: 0}; // Below 3.16.0, --collect-systime=nsec is not supported

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
      `valgrind version ${formatValgrindVersion(
        version
      )} is not supported, please upgrade to at least ${formatValgrindVersion(
        MIN_VALGRIND_VERSION
      )}. Upgrading to Ubuntu 22.04+ will allow you to have a valid version.`
    );
  }
};

interface ValgrindVersion {
  major: number;
  minor: number;
  patch: number;
  codspeed?: number;
}

const formatValgrindVersion = (version: ValgrindVersion): string => {
  return `${version.major}.${version.minor}.${version.patch}${
    version.codspeed ? `.codspeed${version.codspeed}` : ""
  }`;
};

export const parseValgrindVersion = (
  versionOutput: string
): ValgrindVersion => {
  // versionOutput is something like "valgrind-3.16.0", "valgrind-3.16.0.codspeed" or "valgrind-3.16.0.codspeed1"
  const versionMatch = versionOutput.match(
    /valgrind-(\d+)\.(\d+)\.(\d+)(\.codspeed(\d*))?$/
  );
  if (!versionMatch) {
    throw new Error(`Valgrind version ${versionOutput} is not valid`);
  }
  return {
    major: parseInt(versionMatch[1]),
    minor: parseInt(versionMatch[2]),
    patch: parseInt(versionMatch[3]),
    codspeed: versionMatch[4]
      ? versionMatch[5]
        ? parseInt(versionMatch[5])
        : 0
      : undefined,
  };
};

export const isVersionValid = (version: ValgrindVersion): boolean => {
  if (version.codspeed !== undefined) return true;
  return (
    version.major >= MIN_VALGRIND_VERSION.major &&
    (version.major > MIN_VALGRIND_VERSION.major ||
      version.minor >= MIN_VALGRIND_VERSION.minor) &&
    (version.major > MIN_VALGRIND_VERSION.major ||
      version.minor > MIN_VALGRIND_VERSION.minor ||
      version.patch >= MIN_VALGRIND_VERSION.patch)
  );
};
