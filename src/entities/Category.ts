import "reflect-metadata";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: "name_ar" })
  nameAr!: string;

  @Column({ name: "thumbnail_path", type: "text", nullable: true })
  thumbnailPath!: string | null;
}
