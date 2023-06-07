import {exec} from "@actions/exec";
import * as core from "@actions/core";

const getPythonObjects = async (): Promise<string[]> => {
  let soOutput = "";
  try {
    await exec(
      "python",
      [
        "-c",
        "import sysconfig; print('/'.join(sysconfig.get_config_vars('LIBDIR', 'INSTSONAME')))",
      ],
      {
        silent: true,
        listeners: {
          stdout: (data: Buffer) => {
            soOutput += data.toString();
          },
        },
      }
    );
    return [soOutput.trim()];
  } catch (error) {
    core.debug(`Failed to get python shared objects: ${error}`);
    return [];
  }
};

export const getObjectsPathToIgnore = async (): Promise<string[]> => {
  const pythonSharedObjects = await getPythonObjects();
  return pythonSharedObjects;
};
