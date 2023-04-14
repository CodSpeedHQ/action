import {
  isVersionValid,
  parseValgrindVersion,
  checkValgrindVersion,
} from "../src/helpers/valgrind";
import {exec} from "@actions/exec";

jest.mock("@actions/exec");
const execMock = exec as unknown as jest.Mock;

describe("valgrind helpers", () => {
  describe("isVersionValid", () => {
    test("should return true when version is greater than or equal to minimum version", () => {
      expect(isVersionValid([3, 16, 0])).toBe(true);
      expect(isVersionValid([3, 16, 1])).toBe(true);
      expect(isVersionValid([3, 17, 0])).toBe(true);
      expect(isVersionValid([4, 0, 0])).toBe(true);
    });

    test("should return false when version is less than minimum version", () => {
      expect(isVersionValid([3, 15, 0])).toBe(false);
      expect(isVersionValid([2, 0, 0])).toBe(false);
      expect(isVersionValid([3, 15, 5])).toBe(false);
      expect(isVersionValid([3, 14, 0])).toBe(false);
    });
  });

  describe("parseValgrindVersion", () => {
    test("should parse version string correctly", () => {
      const versionString = "valgrind-3.16.0";
      const version = parseValgrindVersion(versionString);
      expect(version).toEqual([3, 16, 0]);
    });

    test("should throw an error if version string is not found", () => {
      const versionString = "some random string";
      expect(() => parseValgrindVersion(versionString)).toThrow(
        "Failed to get valgrind version"
      );
    });

    test("should throw an error if version string is invalid", () => {
      const versionString = "valgrind-3.16.0.1";
      expect(() => parseValgrindVersion(versionString)).toThrow(
        "valgrind version 3.16.0.1 is not valid"
      );
    });
  });
  describe("checkValgrindVersion", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });
    test("should throw an error if valgrind is not installed", async () => {
      execMock.mockRejectedValueOnce(
        new Error("Error: Unable to locate executable file")
      );
      await expect(checkValgrindVersion()).rejects.toThrow(
        "valgrind is not installed"
      );
    });
    test("should throw an error if parseValgrindVersion returns a non-version value", async () => {
      execMock.mockImplementationOnce(async (_, __, {listeners}) => {
        listeners.stdout?.(Buffer.from("valgrind-foo"));
      });
      await expect(checkValgrindVersion()).rejects.toThrow(
        "valgrind version foo is not valid"
      );
    });
    test("should throw an error if installed valgrind version is too old", async () => {
      execMock.mockImplementationOnce(async (_, __, {listeners}) => {
        listeners.stdout?.(Buffer.from("valgrind-3.15.0"));
      });
      await expect(checkValgrindVersion()).rejects.toThrow(
        "valgrind version 3.15.0 is not supported, please upgrade to at least 3.16.0. Upgrading to Ubuntu 22.04+ will allow you to have a valid version."
      );
    });
    test("should not throw an error when the Valgrind version is valid", async () => {
      execMock.mockImplementationOnce(async (_, __, {listeners}) => {
        listeners.stdout?.(Buffer.from("valgrind-3.16.0"));
      });
      await expect(checkValgrindVersion()).resolves.not.toThrow();
    });
  });
});
