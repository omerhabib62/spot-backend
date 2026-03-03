import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OnboardingStatus } from '../../common/enums/onboarding-status.enum';
import { User } from '../../auth/entities/user.entity';

@Entity('onboarding_sessions')
export class OnboardingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 1 })
  currentStep: number;

  @Column({ type: 'varchar', default: OnboardingStatus.IN_PROGRESS })
  status: OnboardingStatus;

  @Column({ nullable: true })
  notificationEmail: string;

  @Column({ type: 'jsonb', nullable: true })
  stepData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
