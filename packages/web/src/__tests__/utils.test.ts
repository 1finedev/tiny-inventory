import { describe, it, expect } from "bun:test";
import { cn } from "@/lib/utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should combine class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should filter out falsy values", () => {
      expect(cn("class1", null, undefined, false, "class2")).toBe("class1 class2");
    });

    it("should handle empty strings", () => {
      expect(cn("class1", "", "class2")).toBe("class1 class2");
    });

    it("should handle single class", () => {
      expect(cn("class1")).toBe("class1");
    });

    it("should handle no arguments", () => {
      expect(cn()).toBe("");
    });
  });
});
