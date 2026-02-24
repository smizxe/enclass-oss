const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const post = await prisma.post.findFirst({
            select: {
                id: true,
                pinned: true
            }
        });

        console.log('Post with pinned:', post);
        console.log('Pinned column exists.');

    } catch (e) {
        console.error('Error selecting pinned:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
