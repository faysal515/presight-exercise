import { z } from "zod";
import {
  commaSeparatedQueryParam,
  limitQueryParam,
  pageQueryParam,
  searchQueryParam,
} from "../../lib/zodQueryParams.js";

export const listUsersQuerySchema = z.object({
  page: pageQueryParam,
  limit: limitQueryParam,
  search: searchQueryParam,
  nationality: commaSeparatedQueryParam(50, 100),
  hobbies: commaSeparatedQueryParam(50, 100),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
