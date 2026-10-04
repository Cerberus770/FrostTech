const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

p.techRequest.findMany({
  include: { technician: { select: { firstName: true, lastName: true } } }
}).then(r => {
  console.log('Count:', r.length);
  r.forEach(x => console.log(x.reqId, x.technicianId, x.status));
}).finally(() => p.$disconnect());
