export { default } from "next-auth/middleware";

export const config = { matcher: ["/feed", "/api/image", "/api/upload/:path*", "/api/posts/:path*"] };
