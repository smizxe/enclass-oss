import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            const path = req.nextUrl.pathname;
            if (path.startsWith("/teacher")) {
                return token?.role === "TEACHER";
            }
            if (path.startsWith("/student")) {
                return token?.role === "STUDENT" || token?.role === "TEACHER";
            }
            return !!token;
        },
    },
});

export const config = {
    matcher: ["/teacher/:path*", "/student/:path*"],
};
