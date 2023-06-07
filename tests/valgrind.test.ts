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
    test.each([
      {major: 3, minor: 16, patch: 0},
      {major: 3, minor: 16, patch: 1},
      {major: 3, minor: 17, patch: 0},
      {major: 4, minor: 0, patch: 0},
    ])(
      "should return true when version $major-$minor-$patch is greater than or equal to minimum version",
      version => {
        expect(isVersionValid(version)).toBe(true);
      }
    );
    test.each([
      {major: 3, minor: 16, patch: 0, codspeed: 1},
      {major: 4, minor: 0, patch: 0, codspeed: 1},
      {major: 3, minor: 15, patch: 0, codspeed: 1},
      {major: 2, minor: 0, patch: 0, codspeed: 1},
    ])(
      "should return true when version $major-$minor-$patch-codspeed$codspeed is from codspeed",
      version => {
        expect(isVersionValid(version)).toBe(true);
      }
    );
    test.each([
      {major: 3, minor: 15, patch: 0},
      {major: 2, minor: 0, patch: 0},
      {major: 3, minor: 15, patch: 5},
      {major: 3, minor: 14, patch: 0},
    ])(
      "should return false when version $major-$minor-$patch is less than minimum version",
      version => {
        expect(isVersionValid(version)).toBe(false);
      }
    );
  });

  describe("parseValgrindVersion", () => {
    test.each([
      {input: "valgrind-3.16.0", expected: {major: 3, minor: 16, patch: 0}},
      {input: "valgrind-4.2.1", expected: {major: 4, minor: 2, patch: 1}},
      {
        input: "valgrind-3.16.0.codspeed",
        expected: {major: 3, minor: 16, patch: 0, codspeed: 0},
      },
      {
        input: "valgrind-3.16.0.codspeed1",
        expected: {major: 3, minor: 16, patch: 0, codspeed: 1},
      },
      {
        input: "valgrind-3.16.1.codspeed2",
        expected: {major: 3, minor: 16, patch: 1, codspeed: 2},
      },
    ])("should parse version string '%s' correctly", ({input, expected}) => {
      const version = parseValgrindVersion(input);
      expect(version).toEqual(expected);
    });

    test("should throw an error if version string is not found", () => {
      const versionString = "some random string";
      expect(() => parseValgrindVersion(versionString)).toThrow(
        `Valgrind version ${versionString} is not valid`
      );
    });

    test("should throw an error if version string is invalid", () => {
      const versionString = "valgrind-3.16.0.1";
      expect(() => parseValgrindVersion(versionString)).toThrow(
        `Valgrind version ${versionString} is not valid`
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
        "Valgrind version valgrind-foo is not valid"
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
