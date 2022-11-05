import * as core from "@actions/core";
import {exec} from "@actions/exec";

const prepare = async (): Promise<void> =>
  core.group("Prepare environment", async () => {
    try {
      await exec("sudo apt-get install -y valgrind", [], {
        silent: true,
      });
      await exec("pip uninstall pytest-benchmark -y", [], {
        silent: true,
      });
      try {
        await exec("pip show pytest-codspeed", [], {
          silent: true,
        });
      } catch (e) {
        core.warning(
          "pytest-codspeed is not installed in your environment. Installing it..."
        );
        await exec("pip install pytest-codspeed", [], {
          silent: true,
        });
      }
    } catch (error) {
      throw new Error(`Failed to prepare environment: ${error}`);
    }
    core.info("Environment ready");
  });

export default prepare;
