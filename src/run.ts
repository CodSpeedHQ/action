import * as core from "@actions/core";
import {exec} from "@actions/exec";
import {ActionInputs} from "./interfaces";
import {tmpdir} from "os";
import {randomBytes} from "crypto";
import * as Path from "path";
import {mkdirSync} from "fs";
import {harvestPerfMaps} from "./helpers/perfMaps";
import {getObjectsPathToIgnore} from "./helpers/objectsPath";

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
  const childrenSkipPatterns = ["*/esbuild"];
  const objectsToIgnore = await getObjectsPathToIgnore();
  core.debug(`Objects to ignore: ${objectsToIgnore.join(", ")}`);
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
    `--trace-children-skip=${childrenSkipPatterns.join(",")}`,
    ...objectsToIgnore.map(path => `--obj-skip=${path}`),
  ];

  const benchCommand = inputs.run
    // Fixes a compatibility issue with cargo 1.66+ running directly under valgrind <3.20
    .replace("cargo codspeed", "cargo-codspeed")
    // Escape double quotes since we're going to run this command in a subshell
    .replace(/"/g, '\\"');

  const customBinPath = `${__dirname}/bin`;
  core.debug(`custom bin path: ${customBinPath}`);

  try {
    const command = [
      "setarch",
      arch,
      "-R",
      "valgrind",
      ...valgrindOptions,
      `sh -c "${benchCommand}"`,
    ].join(" ");
    core.debug(`Running: ${command}`);
    const exitCode = await exec(command, [], {
      cwd: inputs.workingDirectory,
      env: {
        ...process.env,
        // prepend the custom dist/bin folder to the path, to run our custom node script instead of the regular node
        PATH: `${customBinPath}:${process.env.PATH}`,
        PYTHONMALLOC: "malloc",
        PYTHONHASHSEED: "0",
        /**
         * @deprecated this should not be used to add new flags and
         * the getV8Flags from codspeed-node should be preferred
         * (available from 1.2.0)
         */
        CODSPEED_V8_FLAGS: [
          "--hash-seed=1",
          "--random-seed=1",
          "--no-randomize-hashes",
          "--no-scavenge-task",
          "--no-opt ",
          "--predictable ",
          "--predictable-gc-schedule",
        ].join(" "),
        ARCH: arch,
        CODSPEED_ENV: "github",
      },
      silent: true,
      listeners: {
        stdline: outputListener,
        errline: outputListener,
      },
    });
    if (exitCode !== 0) {
      throw new Error(`Process exited with non-zero exit code: ${exitCode}`);
    }
  } catch (error) {
    core.debug(`Error: ${error}`);
    throw new Error("Failed to run benchmarks");
  }
  await harvestPerfMaps(profileFolder);
  core.endGroup();
  return {profileFolder};
};
export default run;
