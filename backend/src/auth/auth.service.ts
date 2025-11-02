import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: { email: string; password: string; name?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hash, name: dto.name },
    });
    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null; // wallet users have no password
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    return user;
  }

  login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const { password, ...rest } = user as any;
    return rest;
  }
}
