import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import { DatabaseSyncService } from '../mongodb/database-sync.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private databaseSync: DatabaseSyncService,
  ) {}

  async register(dto: { email: string; password: string; name?: string; role?: string }) {
    console.log('🔍 Registration Debug - Raw DTO received:', dto);
    console.log('🔍 Registration Debug - DTO keys:', Object.keys(dto));
    console.log('🔍 Registration Debug - DTO values:', Object.values(dto));
    console.log('🔍 Registration Debug - Detailed DTO:', { 
      email: dto.email, 
      name: dto.name, 
      role: dto.role,
      roleType: typeof dto.role,
      roleExists: 'role' in dto,
      dtoStringified: JSON.stringify(dto)
    });

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 10);
    
    // Ensure role is properly set
    const userRole = dto.role as any || 'FREELANCER';
    console.log('🎯 Final role being saved:', userRole);

    const user = await this.prisma.user.create({
      data: { 
        email: dto.email, 
        password: hash, 
        name: dto.name,
        role: userRole,
      },
    });

    console.log('✅ User created in MySQL:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Sync user to MongoDB Atlas for analytics
    try {
      await this.databaseSync.syncUserCreated(user.id);
    } catch (error) {
      console.log(
        'MongoDB sync failed (non-critical):',
        (error as Error).message,
      );
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
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
