import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { EditorState } from "@/types/editor-state";
import { Template } from "./Template";
import { User } from "./User";

@Entity("user_designs")
@Index(["userId", "templateId"])
export class UserDesign {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "template_id", type: "uuid" })
  templateId!: string;

  @ManyToOne(() => Template, { onDelete: "CASCADE" })
  @JoinColumn({ name: "template_id" })
  template!: Template;

  @Column({ type: "varchar", length: 120, default: "تصميمي" })
  title!: string;

  @Column({ name: "editor_state", type: "jsonb" })
  editorStateJson!: EditorState;

  @Column({ name: "voice_path", type: "varchar", length: 512, nullable: true })
  voicePath!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
