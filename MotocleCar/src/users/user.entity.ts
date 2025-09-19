import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Score } from '../scores/score.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];
}
