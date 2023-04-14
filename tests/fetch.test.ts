import fetch from "../src/helpers/fetch";

import nodeFetch from "node-fetch";
jest.mock("node-fetch");

describe("fetch function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should propagate errors when retries is not set", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock.mockRejectedValueOnce(new Error("Error 1"));

    const url = "https://example.com";
    const options = {};

    await expect(fetch(url, options)).rejects.toThrowError("Error 1");
    expect(nodeFetchMock).toHaveBeenCalledTimes(1);
  });

  it("should throw directly on 500 when retries is not set", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock.mockResolvedValueOnce({
      status: 500,
      text: jest.fn().mockResolvedValue("Error 500"),
    });

    const url = "https://example.com";
    const options = {};

    await expect(fetch(url, options)).rejects.toThrowError(
      "Unexpected status code: 500 Error 500"
    );
    expect(nodeFetchMock).toHaveBeenCalledTimes(1);
  });

  it("should retry when fetch throws", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock.mockRejectedValueOnce(new Error("Error 1"));
    nodeFetchMock.mockResolvedValueOnce({
      status: 200,
      text: jest.fn().mockResolvedValue("Success"),
    });

    const url = "https://example.com";
    const options = {
      retries: 3,
      delay: 0,
    };

    const result = await fetch(url, options);

    expect(nodeFetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(200);
    expect(await result.text()).toBe("Success");
  });

  it("should retry when fetch returns 500 and 400 errors", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock
      .mockResolvedValueOnce({
        status: 500,
        text: jest.fn().mockResolvedValue("Error 500"),
      })
      .mockResolvedValueOnce({
        status: 400,
        text: jest.fn().mockResolvedValue("Error 400"),
      })
      .mockResolvedValueOnce({
        status: 200,
        text: jest.fn().mockResolvedValue("Success"),
      });

    const url = "https://example.com";
    const options = {
      retries: 3,
      delay: 0,
    };

    const result = await fetch(url, options);

    expect(nodeFetchMock).toHaveBeenCalledTimes(3);
    expect(result.status).toBe(200);
    expect(await result.text()).toBe("Success");
  });

  it("should propagate errors when the number of retries is exceeded", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock.mockRejectedValueOnce(new Error("Error 1"));
    nodeFetchMock.mockRejectedValueOnce(new Error("Error 2"));
    nodeFetchMock.mockRejectedValueOnce(new Error("Error 3"));

    const url = "https://example.com";
    const options = {
      retries: 2,
      delay: 0,
    };

    await expect(fetch(url, options)).rejects.toThrowError("Error 3");
    expect(nodeFetchMock).toHaveBeenCalledTimes(3);
  });

  it("should propagate 500 errors", async () => {
    const nodeFetchMock = nodeFetch as unknown as jest.Mock;

    nodeFetchMock.mockResolvedValue({
      status: 500,
      text: jest.fn().mockResolvedValue("Error 500"),
    });

    const url = "https://example.com";
    const options = {
      retries: 2,
      delay: 0,
    };

    await expect(fetch(url, options)).rejects.toThrowError(
      "Unexpected status code: 500 Error 500"
    );
    expect(nodeFetchMock).toHaveBeenCalledTimes(3);
  });
});
