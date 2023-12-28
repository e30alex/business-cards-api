import { Router, Request, Response } from "express";
import { injectable, inject } from "inversify";
import { EntityManager, ObjectId } from "@mikro-orm/mongodb";
import _ from "lodash";

import { UserRole } from "./../models/user.model";
import { Authorized } from "../decorators/authorized";
import { Route } from "../decorators/route";
import { AuthService } from "../services/auth.service";
import User from "../entities/user.entity";
import { AuthRequest } from "../types";

@injectable()
export class UsersController {
  private router = Router();
  private em: EntityManager;

  constructor(
    @inject(EntityManager)
    private globalEm: EntityManager,
    private authService?: AuthService
  ) {
    this.em = globalEm.fork();
    this.initializeRoutes();
  }

  public getRouter() {
    return this.router;
  }

  @Route("/", "post")
  @Authorized([UserRole.Admin])
  public async createUser(req: Request, res: Response) {
    const { email, password, role, name } = req.body;

    try {
      if (!email || !password || !name) {
        return res.status(400).send({
          success: false,
          message: "Please provide all the details about the user",
        });
      }

      if (await this.em.findOne(User, { email })) {
        return res.status(400).send({
          success: false,
          message: "User is already registered",
        });
      }

      const user = new User();

      user.name = name;
      user.email = email;
      user.password = await this.authService.hashPassword(password);
      user.role = role ?? UserRole.User;

      const data = this.em.create(User, user);

      this.em.persistAndFlush(data);

      res.send({
        success: true,
        message: "User created successfully",
        data,
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "post")
  public async signIn(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = await this.em.findOne(User, { email });

      if (!user) {
        throw new Error("Cannot find user");
      }

      await this.authService.comparePassword(password, user.password);

      const token = this.authService.generateToken(user);

      res.send({
        success: true,
        message: "User logged in successfully",
        data: { token, role: user.role, id: user.id },
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "get")
  @Authorized()
  public async getuserInfo(req: AuthRequest, res: Response) {
    try {
      const loggedInUser = await this.em.getRepository(User).aggregate([
        {
          $match: {
            _id: new ObjectId(req.userId),
          },
        },
        {
          $unset: ["password"],
        },
      ]);

      if (!loggedInUser) {
        throw new Error("Cannot find user");
      }

      res.send({
        success: true,
        message: "Get use info success",
        data: loggedInUser[0],
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "get")
  @Authorized([UserRole.Admin])
  public async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await this.em.find(User, {});

      const filteredUsers = JSON.parse(JSON.stringify(users)).map(
        (user: any) => {
          const newObj = _.cloneDeep(user);

          return _.omit(newObj, ["password"]);
        }
      );

      res.send({
        success: true,
        message: "Get users success",
        data: filteredUsers,
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "put")
  @Authorized([UserRole.Admin])
  public async editUser(req: AuthRequest, res: Response) {
    const { email, password, role, name, id } = req.body;

    try {
      if (!email || !name) {
        return res.status(400).send({
          success: false,
          message: "Please provide all the details about the user",
        });
      }

      const user = await this.em.findOne(User, { id });

      if (!user) {
        return res.status(400).send({
          success: false,
          message: "User not exists",
        });
      }

      user.name = name;
      user.email = email;
      user.password = await this.authService.hashPassword(password);
      user.role = role ?? UserRole.User;

      const data = this.em.upsert(User, user);

      this.em.persistAndFlush(data);

      res.send({
        success: true,
        message: "User updated successfully",
        data,
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "delete")
  @Authorized([UserRole.Admin])
  public async deleteUser(req: AuthRequest, res: Response) {
    const { id } = req.body;

    try {
      const user = await this.em.findOne(User, { id });

      if (!user) {
        throw new Error("Cannot find user");
      }

      this.em.remove(user).flush();

      res.send({
        success: true,
        message: "Delete user success",
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  private initializeRoutes() {
    this.router.post("/signup", this.createUser.bind(this));
    this.router.post("/signin", this.signIn.bind(this));
    this.router.post("/users/get-info", this.getuserInfo.bind(this));
    this.router.put("/users", this.editUser.bind(this));
    this.router.get("/users", this.getUsers.bind(this));
    this.router.delete("/users", this.deleteUser.bind(this));
  }
}
