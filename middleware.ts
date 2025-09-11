import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // List of public routes that don't require authentication
  const publicRoutes = ['/login', '/reset-password']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/_next/')

  // If user is on login page and has a valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow public routes without token
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for token on protected routes
  if (!token || token.trim() === '') {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL('/login', request.url)
    if (pathname !== '/' && pathname !== '/login') {
      redirectUrl.searchParams.set('callbackUrl', pathname)
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (we handle them separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
} 