import { EntityManager } from "@mikro-orm/core";
import { Response, NextFunction } from "express";
import User from "../entities/user.entity";

import { AuthService } from "../services/auth.service";
import { AuthRequest, DecodedTokenPayload } from "../types";

export function Authorized(roles: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: AuthRequest,
      res: Response,
      next: NextFunction
    ) {
      const em: EntityManager = this.em;

      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized",
        });
      }

      const token = authHeader.substring(7, authHeader.length);

      try {
        const decodedToken: DecodedTokenPayload = AuthService.decodeToken(
          token
        ) as DecodedTokenPayload;

        const user = await em.findOne(User, { email: decodedToken.email });

        if (!user || (roles.length && !roles.includes(user.role))) {
          return res.status(401).send({
            success: false,
            message: "Unauthorized",
          });
        }

        req.userId = user.id;
        req.userRole = user.role;

        originalMethod.apply(this, [req, res, next]);
      } catch (error: any) {
        return res.status(401).send({
          success: false,
          message: `Unauthorized - ${error.message}`,
        });
      }
    };

    return descriptor;
  };
}
