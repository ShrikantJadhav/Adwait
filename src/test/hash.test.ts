import { describe, expect, it } from "vitest";
import { bucketHash, readBucketFromHash } from "../lib/hash";

describe("bucket deep links", () => {
  it("reads a bucket id from the hash", () => {
    expect(readBucketFromHash("#bucket=quic")).toBe("quic");
    expect(readBucketFromHash("#bucket=my%20bucket")).toBe("my bucket");
  });

  it("ignores unrelated or malformed hashes", () => {
    expect(readBucketFromHash("")).toBeNull();
    expect(readBucketFromHash("#today")).toBeNull();
    expect(readBucketFromHash("#bucket=quic&x=1")).toBeNull();
    expect(readBucketFromHash("#bucket=%E0%A4%A")).toBeNull();
  });

  it("round-trips ids through hashes", () => {
    expect(bucketHash("quic")).toBe("#bucket=quic");
    expect(readBucketFromHash(bucketHash("my bucket"))).toBe("my bucket");
    expect(bucketHash(null)).toBe("");
  });
});
