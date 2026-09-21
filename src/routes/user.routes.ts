import { Router } from "express";
import { z } from "zod";

import { UserController } from "../controllers/user.controller.js";
import { UserService } from "../services/user.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../errors/app-error.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

const createUserSchema = z.object({
   name: z.string().min(2).max(100),
   email: z.string().email(),
});

router.get("/", asyncHandler(controller.getUsers));

router.get("/:id", asyncHandler(controller.getUserById));

router.post(
   "/",
   asyncHandler(async (req, _res, next) => {
      const result = createUserSchema.safeParse(req.body);

      if (!result.success) {
         next(new AppError("Invalid request body", 400, "VALIDATION_ERROR"));

         return;
      }

      req.body = result.data;
      next();
   }),
   asyncHandler(controller.createUser),
);

export default router;
