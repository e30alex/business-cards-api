import { Entity, PrimaryKey } from "@mikro-orm/core";
import { ObjectId } from "mongodb";

@Entity({ abstract: true })
export class Base {
  @PrimaryKey({ type: ObjectId })
  public readonly _id?: ObjectId;
}
