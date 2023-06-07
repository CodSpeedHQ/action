import * as core from "@actions/core";
import {exec} from "@actions/exec";
import {checkValgrindVersion} from "./helpers/valgrind";
import {downloadFile} from "./helpers/fetch";

const prepare = async (): Promise<void> => {
  core.startGroup("Prepare environment");
  try {
    const valgrindVersion = "3.21.0-0codspeed1";
    const valgrindDebUrl = `https://github.com/CodSpeedHQ/valgrind-codspeed/releases/download/${valgrindVersion}/valgrind_${valgrindVersion}_amd64.deb`;
    const debFilePath = "/tmp/valgrind-codspeed.deb";
    await downloadFile(valgrindDebUrl, debFilePath);

    await exec(`sudo apt install ${debFilePath}`, [], {
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
