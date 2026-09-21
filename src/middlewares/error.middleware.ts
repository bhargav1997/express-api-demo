import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
   console.error(error);

   if (error instanceof ZodError) {
      res.status(400).json({
         success: false,
         error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: error.flatten(),
         },
      });

      return;
   }

   if (error instanceof AppError) {
      res.status(error.statusCode).json({
         success: false,
         error: {
            code: error.code,
            message: error.message,
         },
      });

      return;
   }

   res.status(500).json({
      success: false,
      error: {
         code: "INTERNAL_SERVER_ERROR",
         message: "Something went wrong",
      },
   });
};
