const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking users...");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true }
    });
    console.log(users);

    // Auto-fix the email to lowercase while we're at it
    const hashed = await hash('teacher123', 12);
    const updateRes = await prisma.user.updateMany({
        where: { role: 'TEACHER' },
        data: {
            email: 'cuongdiepvuong@gmail.com',
            password: hashed
        }
    });
    console.log("Updated teachers:", updateRes.count);

    // Also create if zero
    if (updateRes.count === 0) {
        await prisma.user.create({
            data: {
                email: 'cuongdiepvuong@gmail.com',
                password: hashed,
                name: 'Thầy Điệp Vương',
                role: 'TEACHER'
            }
        });
        console.log("Created teacher account because it was missing.");
    }
}

check()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
