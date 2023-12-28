import {
  Entity,
  Property,
  PrimaryKey,
  SerializedPrimaryKey,
} from "@mikro-orm/core";
import { ObjectId } from "mongodb";

import { UserRole } from "../models/user.model";
import { Base } from "./base.entity";

@Entity()
export default class User extends Base {
  @PrimaryKey({ type: ObjectId })
  public readonly _id: ObjectId;

  @SerializedPrimaryKey()
  public readonly id: string;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property()
  role!: UserRole;
}
