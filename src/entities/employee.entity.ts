import {
  Entity,
  Property,
  PrimaryKey,
  SerializedPrimaryKey,
} from "@mikro-orm/core";
import { ObjectId } from "mongodb";

import { Base } from "./base.entity";

@Entity()
export default class Employee extends Base {
  @PrimaryKey({ type: ObjectId })
  public readonly _id: ObjectId;

  @SerializedPrimaryKey()
  public readonly id: string;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  username!: string;

  @Property({ nullable: true })
  role?: string;

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true })
  mobilePhone?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  address?: string;

  @Property({ nullable: true })
  linkedinProfile?: string;

  @Property({ nullable: true })
  profileImage?: string;
}
