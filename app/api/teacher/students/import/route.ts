import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

interface ImportRow {
    name: string;
    email: string;
    password: string;
    class?: string;
}

export async function POST(req: Request) {
    console.log("[STUDENTS_IMPORT] Route hit");

    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        console.log("[STUDENTS_IMPORT] Session valid, processing form data...");

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("[STUDENTS_IMPORT] No file provided");
            return new NextResponse("No file provided", { status: 400 });
        }

        console.log(`[STUDENTS_IMPORT] File: ${file.name}, size: ${file.size}`);

        // Dynamic import xlsx to avoid Turbopack bundling issues
        const XLSX = await import("xlsx");

        // Read Excel file
        let data: ImportRow[] = [];
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json<ImportRow>(worksheet);
            console.log(`[STUDENTS_IMPORT] Parsed ${data.length} rows`);
        } catch (readError) {
            console.error("[STUDENTS_IMPORT] Parsing error:", readError);
            return new NextResponse("Invalid Excel file format", { status: 400 });
        }

        if (!data.length) {
            return new NextResponse("File is empty", { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Cache for classes (case-insensitive lookup)
        const classCache: Record<string, string> = {};

        // Process each row
        for (const row of data) {
            try {
                // Validate required fields
                if (!row.name || !row.email || !row.password) {
                    results.failed++;
                    results.errors.push(`Missing fields: ${row.email || "no email"}`);
                    continue;
                }

                const emailLower = row.email.toString().trim().toLowerCase();

                // Check if email already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: emailLower }
                });

                if (existingUser) {
                    results.failed++;
                    results.errors.push(`Email exists: ${row.email}`);
                    continue;
                }

                // Hash password
                const hashedPassword = await hash(row.password.toString(), 12);

                // Create student
                const student = await prisma.user.create({
                    data: {
                        name: row.name.toString().trim(),
                        email: emailLower,
                        password: hashedPassword,
                        role: "STUDENT",
                        createdById: session.user.id
                    }
                });

                // Handle class assignment
                if (row.class && row.class.toString().trim()) {
                    const classTitle = row.class.toString().trim();
                    const classKey = classTitle.toLowerCase();

                    let classId = classCache[classKey];

                    if (!classId) {
                        // Find existing class (case-insensitive)
                        const existingClass = await prisma.class.findFirst({
                            where: {
                                teacherId: session.user.id,
                                title: {
                                    equals: classTitle,
                                    mode: "insensitive"
                                }
                            }
                        });

                        if (existingClass) {
                            classId = existingClass.id;
                        } else {
                            // Create new class
                            const newClass = await prisma.class.create({
                                data: {
                                    title: classTitle,
                                    teacherId: session.user.id,
                                    published: true
                                }
                            });
                            classId = newClass.id;
                        }

                        classCache[classKey] = classId;
                    }

                    if (classId) {
                        await prisma.classMember.create({
                            data: {
                                userId: student.id,
                                classId: classId
                            }
                        });
                    }
                }

                results.success++;
            } catch (error) {
                console.error("[STUDENTS_IMPORT] Row error:", error);
                results.failed++;
                results.errors.push(`Error: ${row.email}`);
            }
        }

        console.log("[STUDENTS_IMPORT] Completed:", results);
        return NextResponse.json(results);
    } catch (error) {
        console.error("[STUDENTS_IMPORT] Fatal error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
