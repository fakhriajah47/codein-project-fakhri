import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(message: string, data?: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(error: unknown, fallbackMessage = "Request failed") {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request body",
        error: {
          code: "VALIDATION_ERROR",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || fallbackMessage,
        error: {
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
      error: {
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 }
  );
}
