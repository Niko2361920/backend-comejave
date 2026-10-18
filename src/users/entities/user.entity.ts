import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 254 })
  email!: string;

  @Column({ type: 'integer' })
  age!: number;

  @Column({ length: 30 })
  phone!: string;

  @Column({ default: true })
  isActive!: boolean;
}
