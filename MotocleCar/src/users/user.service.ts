import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(name: string): Promise<User> {
    const user = this.userRepo.create({ name });
    return this.userRepo.save(user);    
  }
}
