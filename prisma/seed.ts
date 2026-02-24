import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create Teacher
    const teacherEmail = "teacher@example.com";
    let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    if (!teacher) {
        teacher = await prisma.user.create({
            data: {
                email: teacherEmail,
                password: await hash("teacher123", 12),
                name: "Mr. Teacher",
                role: "TEACHER",
            },
        });
        console.log("Created Teacher:", teacherEmail);
    }

    // Create Student
    const studentEmail = "student@example.com";
    let student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student) {
        student = await prisma.user.create({
            data: {
                email: studentEmail,
                password: await hash("student123", 12),
                name: "Jane Student",
                role: "STUDENT",
            },
        });
        console.log("Created Student:", studentEmail);
    }

    // Create Demo Class
    if (teacher) {
        const classTitle = "IELTS Masterclass Demo";
        let classObj = await prisma.class.findFirst({ where: { title: classTitle } });
        if (!classObj) {
            classObj = await prisma.class.create({
                data: {
                    title: classTitle,
                    description: "A complete guide to IELTS Band 8.0+",
                    published: true,
                    teacherId: teacher.id,
                    assignments: {
                        create: [
                            { title: "Introduction to Listening", orderIndex: 0, type: "LECTURE", content: "Welcome to the listening module." },
                            { title: "Multiple Choice Practice", orderIndex: 1, type: "QUIZ" },
                            { title: "Writing Task 1", orderIndex: 2, type: "ESSAY", content: "Write a letter..." }
                        ]
                    }
                },
            });
            console.log("Created Demo Class");

            // Assign student to class
            if (student) {
                await prisma.classMember.create({
                    data: {
                        userId: student.id,
                        classId: classObj.id
                    }
                });
                console.log("Assigned student to class");
            }
        }
    }

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
