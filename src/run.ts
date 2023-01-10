import * as core from "@actions/core";
import {exec} from "@actions/exec";
import {ActionInputs} from "./interfaces";
import {tmpdir} from "os";
import {randomBytes} from "crypto";
import * as Path from "path";
import {mkdirSync} from "fs";

const getArch = async (): Promise<string> => {
  let arch = "";
  const archResult = await exec("uname", ["-m"], {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        arch += data.toString();
      },
    },
  });
  if (archResult !== 0) {
    throw new Error("Failed to get architecture");
  }
  return arch.trim();
};

const getTempFolder = (): string => {
  const folder = Path.join(
    tmpdir(),
    `profile.${randomBytes(6).readUIntLE(0, 6).toString(36)}.out`
  );
  // Create the folder
  mkdirSync(folder, {recursive: true});
  return folder;
};

const outputListener = (line: string): void => {
  if (
    ![
      "Using source line as position.",
      "warning: L3 cache found, using its data for the LL simulation.",
      "warning: specified LL cache:",
      "warning: simulated LL cache:",
    ].some(pattern => line.includes(pattern))
  ) {
    core.info(line);
  }
};

const run = async (inputs: ActionInputs): Promise<{profileFolder: string}> => {
  core.startGroup("Run benchmarks");
  const arch = await getArch();
  const profileFolder = getTempFolder();
  const profilePath = `${profileFolder}/%p.out`;
  const valgrindOptions = [
    "-q",
    "--tool=callgrind",
    "--trace-children=yes",
    "--cache-sim=yes",
    "--I1=32768,8,64",
    "--D1=32768,8,64",
    "--LL=8388608,16,64",
    "--instr-atstart=no",
    "--collect-systime=nsec",
    "--compress-strings=no",
    "--combine-dumps=yes",
    "--dump-line=no",
    `--callgrind-out-file=${profilePath}`,
  ];

  // Fixes a compatibility issue with cargo 1.66+ running directly under valgrind <3.20
  const benchCommand = inputs.run.replace("cargo codspeed", "cargo-codspeed");

  try {
    await exec(
      [
        "setarch",
        arch,
        "-R",
        "valgrind",
        ...valgrindOptions,
        benchCommand,
      ].join(" "),
      [],
      {
        env: {
          ...process.env,
          PYTHONMALLOC: "malloc",
          PYTHONHASHSEED: "0",
          ARCH: arch,
          CODSPEED_ENV: "github",
        },
        silent: true,
        listeners: {
          stdline: outputListener,
          errline: outputListener,
        },
      }
    );
  } catch (error) {
    core.debug(`Error: ${error}`);
    throw new Error("Failed to run benchmarks");
  }
  core.endGroup();
  return {profileFolder};
};
export default run;
