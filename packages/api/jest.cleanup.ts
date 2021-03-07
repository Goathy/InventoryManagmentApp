import { PrismaClient } from '@prisma/client';

import { isTesting } from './src/config';

const prisma = new PrismaClient();

if (!isTesting()) {
  process.exitCode = 2;
  throw new Error('Invalid DB');
}

void (async () => {
  await prisma.$queryRaw(`DROP SCHEMA IF EXISTS public CASCADE;`);
  await prisma.$queryRaw(`CREATE SCHEMA public;`);
})()
  .catch(async (err) => {
    await prisma.$disconnect();
    console.error(err);
    process.exit(3);
  })
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  });
