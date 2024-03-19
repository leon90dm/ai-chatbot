// export { auth as middleware } from './auth'
import { authMiddleware } from "@clerk/nextjs";
export default authMiddleware({
  // Allow signed out users to access the specified routes:
  publicRoutes: ['/'],
  // Prevent the specified routes from accessing
  // authentication information:
  // ignoredRoutes: ['/chat(/.*)?'],
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}
