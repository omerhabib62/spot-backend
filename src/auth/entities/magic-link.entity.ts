import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MagicLinkType } from '../../common/enums/magic-link-type.enum';
import { User } from './user.entity';

@Entity('magic_links')
export class MagicLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'varchar' })
  type: MagicLinkType;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
