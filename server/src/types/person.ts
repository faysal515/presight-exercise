export type PersonRecord = {
  /** Present when returned from the API (MongoDB ObjectId as hex string). */
  id?: string;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
};
