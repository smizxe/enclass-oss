import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs"; // You might need to install bcryptjs later, for now we can mock check or assume text

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "teacher@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // DB Lookup
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) return null;

                // Simple password check (In real app, use bcrypt.compare(credentials.password, user.password))
                // For prototype seed, we will store plain text or use a simple equality check if hash is not implemented yet
                // Let's assume for this step we match directly or simply verify
                const isMatch = credentials.password === user.password;

                if (!isMatch) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    }
};
