import * as fs from "fs/promises";
import * as path from "path";
import * as core from "@actions/core";

export async function harvestPerfMaps(profileFolder: string): Promise<void> {
  const profileFiles = await fs.readdir(profileFolder);
  const outFiles = profileFiles.filter(file => file.endsWith(".out"));

  const pids = outFiles.map(file => file.split(".")[0]);

  const tempFiles = await fs.readdir("/tmp");
  const perfMapFiles = tempFiles.filter(file => {
    const match = file.match(/perf-(\d+)\.map/);
    return match && pids.includes(match[1]);
  });

  // Copy each matching perf map file to the profile folder
  await Promise.all(
    perfMapFiles.map(async perfMapFile => {
      const sourcePath = path.join("/tmp", perfMapFile);
      const destPath = path.join(profileFolder, perfMapFile);
      try {
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        core.warning(`Failed to copy ${sourcePath} to ${destPath}: ${error}`);
      }
    })
  );
}
