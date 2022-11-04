import * as core from "@actions/core";
import {exec} from "@actions/exec";

const prepare = async (): Promise<void> =>
  core.group("Prepare environment", async () => {
    try {
      await exec("sudo apt-get install -y valgrind");
      await exec("pip uninstall -y pytest-benchmark");
      await exec(
        "pip install git+https://github.com/CodSpeedHQ/codspeed-python.git#egg=avalanche"
      );
    } catch (error) {
      throw new Error(`Failed to prepare environment: ${error}`);
    }
  });

export default prepare;
