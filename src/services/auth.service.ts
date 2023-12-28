import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

import User from "../entities/user.entity";
import { TokenPayload } from "../types";

export class AuthService {
  private secretKey: string = process.env.SECRET_KEY;
  private expiresIn: string | number = process.env.JWT_EXPIRE;

  public async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }

  public async comparePassword(password: string, userPassword: string) {
    const isMatch = await bcrypt.compare(password, userPassword);

    if (!isMatch) {
      throw new Error("Invalid login credentials");
    }
  }

  public generateToken(user: User) {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.secretKey, {
      expiresIn: this.expiresIn,
    });

    return token;
  }

  static decodeToken(token: string) {
    return jwt.verify(token, process.env.SECRET_KEY);
  }
}
