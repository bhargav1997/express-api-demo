import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";


// It should mostly do:

// HTTP request
//     ↓
// extract data
//     ↓
// call service
//     ↓
// HTTP response

// No SQL.

// No business rules.

// No database queries.
export class UserController {
   constructor(private readonly userService: UserService) {}

   getUsers = async (req: Request, res: Response): Promise<void> => {
      const users = await this.userService.getUsers();

      res.status(200).json({
         success: true,
         data: users,
      });
   };

   getUserById = async (req: Request, res: Response): Promise<void> => {
      const id = Number(req.params.id);

      const user = await this.userService.getUserById(id);

      res.status(200).json({
         success: true,
         data: user,
      });
   };

   createUser = async (req: Request, res: Response): Promise<void> => {
      const user = await this.userService.createUser(req.body);

      res.status(201).json({
         success: true,
         data: user,
      });
   };
}
