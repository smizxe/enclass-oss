const { hash } = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await hash("teacher123", 12);

    const teacher = await prisma.user.create({
        data: {
            email: "teacher@example.com",
            password: hashedPassword,
            name: "Teacher Demo",
            role: "TEACHER"
        }
    });

    console.log("✅ Created Teacher Account:");
    console.log("   Email: teacher@example.com");
    console.log("   Password: teacher123");
    console.log("   ID:", teacher.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
