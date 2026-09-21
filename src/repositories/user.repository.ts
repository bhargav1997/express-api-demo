import { db } from "../config/database.js";

export interface User {
   id: number;
   name: string;
   email: string;
   created_at: Date;
}

export interface CreateUserData {
   name: string;
   email: string;
}

export class UserRepository {
   async findAll(): Promise<User[]> {
      const result = await db.query<User>(
         `
      SELECT id, name, email, created_at
      FROM users
      ORDER BY id DESC
      `,
      );

      return result.rows;
   }

   async findById(id: number): Promise<User | null> {
      const result = await db.query<User>(
         `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = $1
      `,
         [id],
      );

      return result.rows[0] ?? null;
   }

   async findByEmail(email: string): Promise<User | null> {
      const result = await db.query<User>(
         `
      SELECT id, name, email, created_at
      FROM users
      WHERE email = $1
      `,
         [email],
      );

      return result.rows[0] ?? null;
   }

   async create(data: CreateUserData): Promise<User> {
      const result = await db.query<User>(
         `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, created_at
      `,
         [data.name, data.email],
      );

      return result.rows[0];
   }
}
