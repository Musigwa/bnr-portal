import { Prisma } from '@prisma/client';

export const refNumberExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      application: {
        async create({ args, query }) {
          const result = await client.$queryRaw<[{ nextval: bigint }]>`
            SELECT nextval('application_ref_seq')
          `;
          const seq = String(result[0].nextval).padStart(4, '0');
          const year = new Date().getFullYear();
          args.data.refNumber = `BNR-${year}-${seq}`;
          return query(args);
        },
      },
    },
  });
});
