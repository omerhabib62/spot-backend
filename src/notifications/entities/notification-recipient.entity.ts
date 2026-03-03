import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_recipients')
export class NotificationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
