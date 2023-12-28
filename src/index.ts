import express from "express";
import { MikroORM } from "@mikro-orm/mongodb";
import * as dotenv from "dotenv";
import cors from "cors";

import router from "./decorators/route";
import { Entities } from "./entities";
import { UsersController } from "./controllers/users.controller";
import { AuthService } from "./services/auth.service";
import { EmployeesController } from "./controllers/employees.controller";

dotenv.config();

console.log("TEST", process.env.DATABASE_CONNECTION_URL);

const app = express();

app.use(cors());

app.options(
  "*",
  cors({
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(express.json());
app.use(router);

async function main() {
  const orm = await MikroORM.init({
    type: "mongo",
    entities: Entities,
    clientUrl: process.env.DATABASE_CONNECTION_URL,
  });

  const usersController = new UsersController(orm.em, new AuthService());
  const employeesController = new EmployeesController(
    orm.em,
    new AuthService()
  );

  app.use("/uploads", express.static("uploads"));

  app.use("/", usersController.getRouter());
  app.use("/", employeesController.getRouter());

  const port = process.env.PORT;

  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

main().catch(console.error);
