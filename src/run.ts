import * as core from "@actions/core";
import {exec} from "@actions/exec";
import {ActionInputs} from "./interfaces";
import {tmpdir} from "os";
import {randomBytes} from "crypto";
import * as Path from "path";

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

const getTempFile = (): string =>
  Path.join(
    tmpdir(),
    `profile.${randomBytes(6).readUIntLE(0, 6).toString(36)}.out`
  );

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

const run = async (inputs: ActionInputs): Promise<{profilePath: string}> => {
  core.startGroup("Run benchmarks");
  const arch = await getArch();
  const profilePath = getTempFile();
  const valgrindOptions = [
    "-q",
    "--tool=callgrind",
    "--cache-sim=yes",
    "--I1=32768,8,64",
    "--D1=32768,8,64",
    "--LL=8388608,16,64",
    "--instr-atstart=no",
    "--compress-strings=no",
    "--combine-dumps=yes",
    "--dump-line=no",
    `--callgrind-out-file=${profilePath}`,
  ];
  try {
    await exec(
      ["setarch", arch, "-R", "valgrind", ...valgrindOptions, inputs.run].join(
        " "
      ),
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
  return {profilePath};
};
export default run;
