import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { NameOnlyInput } from "../validators/catalog.validator";

// Minimal shape shared by prisma.author / prisma.publisher / prisma.category.
// Using this narrow interface (rather than importing Prisma's generated
// delegate types directly) keeps this factory simple and avoids tripling
// near-identical code across three files.
interface SimpleDelegate {
  findMany(args: any): Promise<any[]>;
  count(args: any): Promise<number>;
  findUnique(args: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
}

export function createCatalogService(delegate: SimpleDelegate, entityLabel: string) {
  return {
    async list(search: string | undefined, skip: number, take: number) {
      const where = search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {};

      const [data, totalCount] = await Promise.all([
        delegate.findMany({ where, skip, take, orderBy: { name: "asc" } }),
        delegate.count({ where }),
      ]);

      return { data, totalCount };
    },

    async getById(id: string) {
      const record = await delegate.findUnique({ where: { id } });
      if (!record) {
        throw new AppError(`${entityLabel} not found`, 404);
      }
      return record;
    },

    async create(input: NameOnlyInput) {
      return delegate.create({ data: { name: input.name } });
    },

    async update(id: string, input: NameOnlyInput) {
      await this.getById(id);
      return delegate.update({ where: { id }, data: { name: input.name } });
    },

    async remove(id: string) {
      await this.getById(id);
      try {
        await delegate.delete({ where: { id } });
      } catch (err: any) {
        // Foreign key violation - this entity is still referenced by books.
        if (err?.code === "P2003") {
          throw new AppError(
            `Cannot delete this ${entityLabel.toLowerCase()} because it is still linked to one or more books`,
            409
          );
        }
        throw err;
      }
    },
  };
}
