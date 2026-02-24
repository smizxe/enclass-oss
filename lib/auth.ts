import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

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

                // DB Lookup (case-insensitive for email)
                const userEmail = credentials.email.toLowerCase();
                const user = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: userEmail,
                            mode: "insensitive"
                        }
                    }
                });

                // Fallback to strict match if insensitive fails (e.g., SQLite doesn't fully support 'insensitive' Mode on all fields depending on Prisma driver features, though we updated the email to lowercase so 'equals' will catch it)
                const finalUser = user || await prisma.user.findFirst({
                    where: { email: userEmail }
                });

                if (!finalUser) return null;

                // Use bcrypt to check password
                const isMatch = await compare(credentials.password, finalUser.password);

                if (!isMatch) return null;

                return {
                    id: finalUser.id,
                    email: finalUser.email,
                    name: finalUser.name,
                    role: finalUser.role
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
