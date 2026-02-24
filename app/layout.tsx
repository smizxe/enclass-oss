import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Online Study Platform",
    description: "IELTS-style learning platform",
};

import { ToastProvider } from "@/components/providers/toaster-provider";
import { NextAuthSessionProvider } from "@/components/providers/session-provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={font.className}>
                <NextAuthSessionProvider>
                    <ToastProvider />
                    {children}
                </NextAuthSessionProvider>
            </body>
        </html>
    );
}
