import { Request } from "express";
import * as jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export interface EmployeeRequest extends Request {
  username?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface DecodedTokenPayload extends jwt.JwtPayload {
  id: string;
  email: string;
  role: string;
}
