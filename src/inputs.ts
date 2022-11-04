import * as core from "@actions/core";
import {ActionInputs} from "./interfaces";

export const getActionInputs = (): ActionInputs => {
  return {
    token: core.getInput("token", {required: true}),
    run: core.getInput("run", {required: true}),
    uploadUrl: core.getInput("upload_url", {required: true}),
  };
};
