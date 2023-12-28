import { Router, Request, Response, NextFunction } from "express";

const router = Router();

interface IRouter {
  [key: string]: (req: Request, res: Response, next: NextFunction) => void;
}

export const Route =
  (path: string, method: string) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const routerMethod = method.toLowerCase() as keyof IRouter;
    //@ts-ignore
    router[routerMethod](
      path,
      (req: Request, res: Response, next: NextFunction) => {
        const result = target[propertyKey](req, res, next);
        if (result instanceof Promise) {
          result.catch(next);
        }
      }
    );
  };

export default router;
