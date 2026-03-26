export type PersonRecord = {
  id?: string;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

export type RankedNationality = { nationality: string; count: number };
export type RankedHobby = { hobby: string; count: number };

export type UsersListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: Record<string, unknown>;
};
