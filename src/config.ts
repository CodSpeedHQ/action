import YAML from "yaml";
import * as core from "@actions/core";
import {readFileSync} from "node:fs";
export interface CodSpeedConfiguration {
  integrations?: {
    mongodb?: {
      uri_env_name: string;
      uri: string;
    };
  };
}

const CONFIG_FILENAMES = [
  "codspeed.yml",
  "codspeed.yaml",
  ".codspeed.yml",
  ".codspeed.yaml",
];

export const getConfig = (): CodSpeedConfiguration => {
  const workspacePath = process.env.GITHUB_WORKSPACE;
  if (workspacePath === undefined) {
    throw new Error("Could not find the workspace path");
  }
  for (const filename of CONFIG_FILENAMES) {
    const configPath = `${workspacePath}/${filename}`;
    try {
      const config = YAML.parse(
        readFileSync(configPath, "utf8")
      ) as CodSpeedConfiguration;
      core.debug(`Using config file from ${configPath}`);
      return config;
    } catch (error) {
      continue;
    }
  }
  core.debug(`No config file found, using default config`);
  return {};
};
