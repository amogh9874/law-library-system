import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { nameOnlySchema } from "../validators/catalog.validator";
import { parsePagination, buildPaginatedResponse } from "../utils/query";
import { logActivity } from "../services/activityLog.service";
import { createCatalogService } from "../services/catalog.service";

export function createCatalogController(
  delegate: Parameters<typeof createCatalogService>[0],
  entityLabel: string,
  moduleName: string
) {
  const service = createCatalogService(delegate, entityLabel);

  const list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const { data, totalCount } = await service.list(search, pagination.skip, pagination.take);
    res.json(buildPaginatedResponse(data, totalCount, pagination));
  });

  const getOne = asyncHandler(async (req: Request, res: Response) => {
    const record = await service.getById(req.params.id);
    res.json(record);
  });

  const create = asyncHandler(async (req: Request, res: Response) => {
    const input = nameOnlySchema.parse(req.body);
    const record = await service.create(input);
    await logActivity({
      userId: req.user!.userId,
      action: `${entityLabel.toUpperCase()}_ADDED`,
      module: moduleName,
      details: input.name,
      req,
    });
    res.status(201).json(record);
  });

  const update = asyncHandler(async (req: Request, res: Response) => {
    const input = nameOnlySchema.parse(req.body);
    const record = await service.update(req.params.id, input);
    await logActivity({
      userId: req.user!.userId,
      action: `${entityLabel.toUpperCase()}_EDITED`,
      module: moduleName,
      details: input.name,
      req,
    });
    res.json(record);
  });

  const remove = asyncHandler(async (req: Request, res: Response) => {
    await service.remove(req.params.id);
    await logActivity({
      userId: req.user!.userId,
      action: `${entityLabel.toUpperCase()}_DELETED`,
      module: moduleName,
      details: req.params.id,
      req,
    });
    res.json({ message: `${entityLabel} deleted successfully` });
  });

  return { list, getOne, create, update, remove };
}
