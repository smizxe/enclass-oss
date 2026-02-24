const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                category: true,
                published: true,
                createdAt: true,
                authorId: true,
            }
        });

        const output = JSON.stringify(posts, null, 2);
        fs.writeFileSync('db-check.txt', output);
        console.log('Written to db-check.txt');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
