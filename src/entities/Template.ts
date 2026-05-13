import "reflect-metadata";
import type { TemplateFieldsConfig } from "@/types/template-fields";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Category } from "./Category";

@Entity("templates")
export class Template {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "category_id" })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  price!: string;

  /** ملف الصورة الأصلي — المعاينة تُولَّد مع علامة مائية؛ التحميل بعد الشراء بدون تعديل */
  @Column({ name: "source_path", default: "legacy/missing-source.png" })
  sourcePath!: string;

  @Column({ name: "fields_json", type: "simple-json", default: "{}" })
  fieldsJson!: TemplateFieldsConfig;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
