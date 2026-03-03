import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  organizationName: string;

  @Column({ type: 'varchar', default: UserRole.LEAD })
  role: UserRole;

  @Column({ type: 'varchar', default: UserStatus.LEAD_UNCONFIRMED })
  status: UserStatus;

  @Column({ nullable: true })
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
