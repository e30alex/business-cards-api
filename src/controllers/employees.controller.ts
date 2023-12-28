import { Router, Request, Response } from "express";
import { injectable, inject } from "inversify";
import { EntityManager, ObjectId } from "@mikro-orm/mongodb";
import _ from "lodash";
import multer from "multer";
import fs from "fs";

import { UserRole } from "./../models/user.model";
import { Authorized } from "../decorators/authorized";
import { Route } from "../decorators/route";
import { AuthService } from "../services/auth.service";
import { AuthRequest, EmployeeRequest } from "../types";
import Employee from "../entities/employee.entity";

// Configure multer
const storage: multer.StorageEngine = multer.memoryStorage();

const upload = multer({ storage: storage });

@injectable()
export class EmployeesController {
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
  @Authorized()
  public async createEmployee(req: Request, res: Response) {
    const {
      firstName,
      lastName,
      phone,
      mobilePhone,
      email,
      address,
      linkedinProfile,
      role,
    } = req.body;

    try {
      if (!email || !firstName || !lastName) {
        return res.status(400).send({
          success: false,
          message:
            "Please provide all the mandatory details about the employee",
        });
      }

      if (await this.em.findOne(Employee, { email })) {
        return res.status(400).send({
          success: false,
          message: "User is already registered",
        });
      }

      const employee = new Employee();

      const username = `${firstName}.${lastName}`.toLowerCase();

      employee.firstName = firstName;
      employee.lastName = lastName;
      employee.username = username;
      employee.role = role;
      employee.email = email;
      employee.phone = phone;
      employee.mobilePhone = mobilePhone;
      employee.address = address;
      employee.linkedinProfile = linkedinProfile;

      if (req.file) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filePath = `uploads/${username}-${uniqueSuffix}.${req.file.originalname
          .split(".")
          .pop()}`;

        fs.writeFileSync(filePath, req.file.buffer);

        employee.profileImage = filePath;
      }

      const data = this.em.create(Employee, employee);

      this.em.persistAndFlush(data);

      res.send({
        success: true,
        message: "Employee created successfully",
        data,
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "get")
  public async getEmployeeInfo(req: EmployeeRequest, res: Response) {
    try {
      const employee = await this.em.findOne(Employee, {
        username: req.body.username,
      });

      if (!employee) {
        res.status(404).send({
          success: true,
          message: "User not found",
        });

        return;
      }

      res.send({
        success: true,
        message: "Get use info success",
        data: employee,
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
  public async getEmployees(req: AuthRequest, res: Response) {
    try {
      const employees = await this.em.find(Employee, {});

      const filteredUsers = JSON.parse(JSON.stringify(employees));

      res.send({
        success: true,
        message: "Get employees success",
        data: filteredUsers,
      });
    } catch (error: any) {
      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  @Route("/", "post")
  @Authorized()
  public async editEmployee(req: Request, res: Response) {
    const {
      id,
      firstName,
      lastName,
      phone,
      mobilePhone,
      email,
      address,
      linkedinProfile,
      role,
    } = req.body;

    try {
      if (!email || !firstName || !lastName) {
        return res.status(400).send({
          success: false,
          message:
            "Please provide all the mandatory details about the employee",
        });
      }

      const employee = await this.em.findOne(Employee, { id });

      if (await this.em.findOne(Employee, { email })) {
        return res.status(400).send({
          success: false,
          message: "User with same email address already exists",
        });
      }

      if (!employee) {
        return res.status(400).send({
          success: false,
          message: "User not exists",
        });
      }

      const username = `${firstName}.${lastName}`.toLowerCase();

      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName || employee.lastName;
      employee.username = username || employee.username;
      employee.role = role || employee.role;
      employee.email = email || employee.email;
      employee.phone = phone || employee.phone;
      employee.mobilePhone = mobilePhone || employee.mobilePhone;
      employee.address = address || employee.address;
      employee.linkedinProfile = linkedinProfile || employee.linkedinProfile;

      if (req.file) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filePath = `uploads/${username}-${uniqueSuffix}.${req.file.originalname
          .split(".")
          .pop()}`;

        fs.writeFileSync(filePath, req.file.buffer);

        employee.profileImage = filePath;
      }

      const data = await this.em.upsert(Employee, employee);

      await this.em.persistAndFlush(data);

      res.send({
        success: true,
        message: "Employee updated successfully",
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
  public async deleteEmployee(req: AuthRequest, res: Response) {
    const { id } = req.body;

    try {
      const user = await this.em.findOne(Employee, { id });

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
    this.router.post(
      "/employees",
      upload.single("profileImage"),
      this.createEmployee.bind(this)
    );
    this.router.post("/employees/get-info", this.getEmployeeInfo.bind(this));
    this.router.post(
      "/edit-employee",
      upload.single("profileImage"),
      this.editEmployee.bind(this)
    );
    this.router.get("/employees", this.getEmployees.bind(this));
    this.router.delete("/employees", this.deleteEmployee.bind(this));
  }
}
