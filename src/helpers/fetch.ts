import nodeFetch, {RequestInit, Response} from "node-fetch";
import fs from "node:fs";
interface FetchOptions extends RequestInit {
  retries?: number;
  delay?: number;
}

const fetch = async (url: string, options: FetchOptions): Promise<Response> => {
  try {
    const res = await nodeFetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "User-Agent": "codspeed-action",
      },
    });
    if (res.status >= 400) {
      throw new Error(
        `Unexpected status code: ${res.status} ${await res.text()}`
      );
    }
    return res;
  } catch (e) {
    if (options.retries === undefined || options.retries === 0) {
      throw e;
    }
    await new Promise(resolve => setTimeout(resolve, options.delay ?? 1000));
    return await fetch(url, {...options, retries: options.retries - 1});
  }
};

export default fetch;

export const postJson = async <T>(
  url: string,
  body: unknown,
  options?: FetchOptions
): Promise<T> => {
  const finalOptions = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  };
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    ...finalOptions,
  });
  return (await res.json()) as T;
};

export const downloadFile = async (
  url: string,
  path: string
): Promise<void> => {
  const response = await fetch(url, {});

  if (!response.ok) {
    throw new Error(
      `Failed to download file. Status: ${response.status} ${response.statusText}`
    );
  }

  const fileStream = fs.createWriteStream(path);
  await new Promise<void>((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", () => {
      fileStream.close();
      resolve();
    });
  });
};
