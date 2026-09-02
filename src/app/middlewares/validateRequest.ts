import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';

const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        cookies: req.cookies,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateRequest;
