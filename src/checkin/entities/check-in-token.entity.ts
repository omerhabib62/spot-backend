import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('check_in_tokens')
export class CheckInToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  contactId: string;

  @Column()
  organizationId: string;

  @Column({ type: 'date' })
  validDate: string;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
