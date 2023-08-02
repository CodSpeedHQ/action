import {exec} from "@actions/exec";
import path from "path";
import fs from "fs";

class MongoTracer {
  private processPromise: Promise<number> | undefined;
  private intrServerAddress: string;
  private profileFolder: string;

  constructor(profileFolder: string) {
    this.intrServerAddress = "0.0.0.0:55581";
    this.profileFolder = profileFolder;
  }

  async start(): Promise<void> {
    this.processPromise = exec("cs-mongo-tracer", [], {
      env: {
        CODSPEED_MONGO_INSTR_SERVER_ADDRESS: this.intrServerAddress,
        CODSPEED_MONGO_PROXY_HOST_PORT: "localhost:27018",
        CODSPEED_MONGO_DEST_HOST_PORT: "localhost:27017",
      },
    });
  }

  async stop(): Promise<void> {
    const resp = await fetch(`http://${this.intrServerAddress}/terminate`, {
      method: "POST",
    });
    if (!resp.ok) {
      throw new Error("Failed to stop the mongo tracer");
    }
    const retCode = await this.processPromise;
    if (retCode !== 0) {
      throw new Error("Failed to stop the mongo tracer");
    }
    const integrationOutDir = path.join(this.profileFolder, "integrations");
    await fs.promises.mkdir(integrationOutDir, {
      recursive: true,
    });

    const json = await resp.json();
    const queriesJsonPath = path.join(integrationOutDir, "mongo.json");
    await fs.promises.writeFile(queriesJsonPath, JSON.stringify(json));
  }
}

export default MongoTracer;
