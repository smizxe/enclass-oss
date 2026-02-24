const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database (JS)...");

    // Create Teacher
    const teacherEmail = "teacher@example.com";
    let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    if (!teacher) {
        teacher = await prisma.user.create({
            data: {
                email: teacherEmail,
                passwordHash: "teacher123",
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
                passwordHash: "student123",
                name: "Jane Student",
                role: "STUDENT",
            },
        });
        console.log("Created Student:", studentEmail);
    }

    // Create Demo Course
    if (teacher && teacher.id) {
        const courseTitle = "IELTS Masterclass Demo";
        let course = await prisma.course.findFirst({ where: { title: courseTitle } });
        if (!course) {
            course = await prisma.course.create({
                data: {
                    title: courseTitle,
                    description: "A complete guide to IELTS Band 8.0+",
                    published: true,
                    teacherId: teacher.id,
                    modules: {
                        create: [
                            {
                                title: "Module 1: Listening Strategies",
                                orderIndex: 0,
                                lessons: {
                                    create: [
                                        { title: "Introduction to Listening", orderIndex: 0, type: "LECTURE", content: "Welcome to the listening module." },
                                        {
                                            title: "Multiple Choice Practice",
                                            orderIndex: 1,
                                            type: "QUIZ",
                                            questions: {
                                                create: [
                                                    {
                                                        type: "MCQ",
                                                        content: JSON.stringify({
                                                            text: "What is the capital of Australia?",
                                                            options: ["Sydney", "Melbourne", "Canberra", "Perth"]
                                                        }),
                                                        correctAnswer: "Canberra",
                                                        points: 1
                                                    },
                                                    {
                                                        type: "MCQ",
                                                        content: JSON.stringify({
                                                            text: "Which functionality is NOT present in the MVP?",
                                                            options: ["Login", "Course Creation", "AI Speaking Grading", "CSV Import"]
                                                        }),
                                                        correctAnswer: "AI Speaking Grading",
                                                        points: 1
                                                    },
                                                    {
                                                        type: "GAP_FILL",
                                                        content: "Next.js 14 uses the {App} Router by default, which supports {Server} Components.",
                                                        correctAnswer: JSON.stringify(["App", "Server"]),
                                                        points: 2
                                                    },
                                                    {
                                                        type: "SORTABLE",
                                                        content: JSON.stringify({
                                                            text: "Arrange the Agile development steps:",
                                                            items: [
                                                                { id: "1", text: "Planning" },
                                                                { id: "2", text: "Development" },
                                                                { id: "3", text: "Testing" }
                                                            ]
                                                        }),
                                                        correctAnswer: JSON.stringify(["1", "2", "3"]),
                                                        points: 3
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                title: "Module 2: Reading Techniques",
                                orderIndex: 1,
                                lessons: {
                                    create: [
                                        { title: "Skimming and Scanning", orderIndex: 0, type: "LECTURE" }
                                    ]
                                }
                            }
                        ]
                    }
                },
            });
            console.log("Created Demo Course");
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
