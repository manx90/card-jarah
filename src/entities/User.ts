import "reflect-metadata";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type UserRole = "user" | "admin";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ type: "varchar", length: 20, default: "user" })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
