import * as core from "@actions/core";
import {getActionInputs} from "./inputs";
import prepare from "./prepare";
import run from "./run";
import upload from "./upload";

const VERSION = process.env.VERSION;

const banner = String.raw`
   ______            __ _____                         __
  / ____/____   ____/ // ___/ ____   ___   ___   ____/ /
 / /    / __ \ / __  / \__ \ / __ \ / _ \ / _ \ / __  /
/ /___ / /_/ // /_/ / ___/ // /_/ //  __//  __// /_/ /
\____/ \____/ \__,_/ /____// .___/ \___/ \___/ \__,_/
  https://codspeed.io     /_/          runner v${VERSION}

  `;

async function main(): Promise<void> {
  try {
    core.info(banner);
    const inputs = getActionInputs();
    await prepare();
    const {profileFolder} = await run(inputs);
    await upload(inputs, profileFolder);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

main();
