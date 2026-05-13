import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Template } from "./Template";
import { User } from "./User";

export type PurchaseStatus = "mock_completed" | "pending_payment";

@Entity("purchases")
@Index(["userId", "templateId"], { unique: true })
export class Purchase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "template_id" })
  templateId!: string;

  @ManyToOne(() => Template, { onDelete: "CASCADE" })
  @JoinColumn({ name: "template_id" })
  template!: Template;

  @Column({ type: "varchar", length: 40, default: "mock_completed" })
  status!: PurchaseStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
