import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MagicLinkType } from '../../common/enums/magic-link-type.enum';
import { User } from './user.entity';

@Entity('magic_links')
@Index(['userId', 'createdAt'])
export class MagicLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'varchar' })
  type: MagicLinkType;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.magicLinks)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  usedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  invalidatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
