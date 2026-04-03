import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  const response = successResponse({ message: 'Logged out successfully' });
  response.cookies.delete('token');
  return response;
}
