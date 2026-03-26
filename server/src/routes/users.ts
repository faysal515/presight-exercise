import { Router } from "express";
import { listUsersQuerySchema } from "../api/users/listUsersQuery.js";
import { findUsers } from "../api/users/usersRepository.js";
import { sendError, sendSuccess } from "../lib/apiResponse.js";
import { logger } from "../logger.js";
import { topHobbies, topNationalities } from "../startup/seedMongo.js";

export const usersRouter = Router();

usersRouter.get("/filters", (_req, res) => {
  logger.info({ message: "users filters" });
  return sendSuccess(
    res,
    { nationalities: topNationalities, hobbies: topHobbies }
  );
});

usersRouter.get("/", async (req, res, next) => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const issues = parsed.error.flatten();
      logger.warn({
        message: "GET /api/users invalid query parameters",
        issues,
      });
      return sendError(res, 400, "Invalid query parameters", issues);
    }

    const q = parsed.data;
    const { rows, total } = await findUsers(q);

    logger.info({
      message: "users list",
      page: q.page,
      limit: q.limit,
      total,
      filters: {
        search: q.search,
        nationality: q.nationality.length > 0 ? q.nationality : undefined,
        hobbies: q.hobbies.length > 0 ? q.hobbies : undefined,
      },
    });

    const totalPages = q.limit > 0 ? Math.ceil(total / q.limit) : 0;
    const hasMore = q.page * q.limit < total;

    return sendSuccess(res, rows, {
      page: q.page,
      limit: q.limit,
      total,
      totalPages,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});
