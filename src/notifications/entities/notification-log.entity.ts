import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  recipientId: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ default: 'sent' })
  status: string;

  @CreateDateColumn()
  sentAt: Date;
}
