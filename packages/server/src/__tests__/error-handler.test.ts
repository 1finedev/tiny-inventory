import { describe, it, expect } from "bun:test";
import { AppError } from "@/lib";
import { errorHandler } from "@/middleware/error-handler";
import { Error as MongooseError } from "mongoose";

function createMockContext() {
  let body: Record<string, unknown> = {};
  let statusCode = 200;
  const json = (data: Record<string, unknown>, status: number) => {
    body = data;
    statusCode = status;
    return new Response(JSON.stringify(data), { status });
  };
  return { json, get body() {
    return body;
  }, get statusCode() {
    return statusCode;
  } };
}

describe("errorHandler", () => {
  it("should pass through AppError with correct status and message", async () => {
    const c = createMockContext() as any;
    const err = new AppError("Bad request", 400);
    await errorHandler(err, c);
    expect(c.body).toEqual({ status: "fail", message: "Bad request" });
    expect(c.statusCode).toBe(400);
  });

  it("should include error.data in body when present", async () => {
    const c = createMockContext() as any;
    const err = new AppError("Conflict", 409, { field: "sku" });
    await errorHandler(err, c);
    expect(c.body).toEqual({ status: "fail", message: "Conflict", error: { field: "sku" } });
    expect(c.statusCode).toBe(409);
  });

  it("should map Mongoose CastError to 400", async () => {
    const c = createMockContext() as any;
    const err = new MongooseError.CastError("ObjectId", "invalid-id", "_id");
    await errorHandler(err, c);
    expect(c.body.status).toBe("fail");
    expect(c.body.message).toContain("Invalid");
    expect(c.body.message).toContain("invalid-id");
    expect(c.statusCode).toBe(400);
  });

  it("should map Mongoose ValidationError to 400", async () => {
    const c = createMockContext() as any;
    const err = new MongooseError.ValidationError();
    (err as any).errors = { name: { message: "Name is required" } };
    await errorHandler(err, c);
    expect(c.body.status).toBe("fail");
    expect(c.body.message).toContain("Validation failed");
    expect(c.body.message).toContain("Name is required");
    expect(c.statusCode).toBe(400);
  });

  it("should map MongoDB duplicate key (11000) to 409", async () => {
    const c = createMockContext() as any;
    const err = { code: 11000, keyValue: { sku: "DUP-001" } };
    await errorHandler(err, c);
    expect(c.body).toEqual({ status: "fail", message: 'sku "DUP-001" already exists' });
    expect(c.statusCode).toBe(409);
  });

  it("should map generic Error to 500", async () => {
    const c = createMockContext() as any;
    await errorHandler(new Error("Something broke"), c);
    expect(c.body).toEqual({ status: "error", message: "Something broke" });
    expect(c.statusCode).toBe(500);
  });

  it("should use default message for non-Error throw", async () => {
    const c = createMockContext() as any;
    await errorHandler("string error", c);
    expect(c.body.message).toBe("Internal server error");
    expect(c.statusCode).toBe(500);
  });
});
