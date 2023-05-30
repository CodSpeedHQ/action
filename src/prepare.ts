import * as core from "@actions/core";
import {exec} from "@actions/exec";
import {checkValgrindVersion} from "./helpers/valgrind";

const prepare = async (): Promise<void> => {
  core.startGroup("Prepare environment");
  try {
    await exec("sudo apt-get update", [], {
      silent: true,
    });
    await exec("sudo apt-get install -y valgrind", [], {
      silent: true,
    });
    await checkValgrindVersion();
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
  core.endGroup();
};

export default prepare;
