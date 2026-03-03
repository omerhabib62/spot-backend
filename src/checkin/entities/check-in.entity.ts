import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuickOption } from '../../common/enums/quick-option.enum';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contactId: string;

  @Column()
  organizationId: string;

  @Column({ type: 'varchar', nullable: true })
  quickOption: QuickOption;

  @Column({ type: 'text', nullable: true })
  responseText: string;

  @Column({ type: 'varchar', default: 'stable' })
  severity: string;

  @Column({ default: false })
  isDraft: boolean;

  @Column({ default: false })
  submitted: boolean;

  @Column({ type: 'date' })
  checkInDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
