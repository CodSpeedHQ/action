import * as core from "@actions/core";
import {ActionInputs} from "./interfaces";

export const getActionInputs = (): ActionInputs => {
  const token = core.getInput("token", {required: false});
  const tokenless = token.length === 0;
  return {
    uploadUrl: core.getInput("upload_url", {required: true}),
    run: core.getInput("run", {required: true}),
    token,
    tokenless,
  };
};
