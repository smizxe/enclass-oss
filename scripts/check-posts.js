const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking posts...");
    const posts = await prisma.post.findMany({
        select: { id: true, title: true, category: true, published: true }
    });
    console.log(posts);
}

check()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error(e); prisma.$disconnect(); });
