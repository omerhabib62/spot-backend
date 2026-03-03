import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { MagicLink } from './magic-link.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'varchar', default: UserRole.LEAD })
  role: UserRole;

  @Index()
  @Column({ type: 'varchar', default: UserStatus.LEAD_UNCONFIRMED })
  status: UserStatus;

  @Column({ default: false })
  hasCompletedOnboarding: boolean;

  @Column({ type: 'int', default: 1 })
  onboardingCurrentStep: number;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastActivityAt: Date | null;

  @OneToMany(() => MagicLink, (ml) => ml.user)
  magicLinks: MagicLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
