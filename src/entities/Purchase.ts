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

export type PurchaseStatus =
  | "mock_completed"
  | "pending_payment"
  | "paid"
  | "payment_failed"
  | "payment_cancelled";

@Entity("purchases")
@Index(["userId", "templateId"], { unique: true })
@Index(["paymentTrackId"], { unique: true })
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

  /** معرّف تتبع فريد لكل محاولة دفع (حد البوابة 30 حرفاً أبجدياً رقماً) */
  @Column({ name: "payment_track_id", type: "varchar", length: 30, nullable: true })
  paymentTrackId!: string | null;

  @Column({ name: "payment_provider", type: "varchar", length: 24, nullable: true })
  paymentProvider!: string | null;

  @Column({ name: "payment_meta", type: "simple-json", nullable: true })
  paymentMeta!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
