"use client";

import { SessionProvider } from "next-auth/react";

export const NextAuthSessionProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    return <SessionProvider>{children}</SessionProvider>;
};
