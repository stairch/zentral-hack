import { NextResponse } from "next/server"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
  message?: string
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  )
}

export function validationError(
  message: string,
  errors?: Record<string, string>
): NextResponse<ApiResponse<null>> {
  console.error(message, errors)
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors && { errors })
    },
    { status: 400 }
  )
}

export function unauthorizedError(message = "Unauthorized"): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 401)
}

export function notFoundError(resource: string): NextResponse<ApiResponse<null>> {
  return errorResponse(`${resource} not found`, 404)
}

export function serverError(message = "Internal server error"): NextResponse<ApiResponse<null>> {
  return errorResponse(message, 500)
}
