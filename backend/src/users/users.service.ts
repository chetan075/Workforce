import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import { Role, SkillLevel, AvailabilityStatus } from '@prisma/client';

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  title?: string;
  location?: string;
  hourlyRate?: number;
  availability?: AvailabilityStatus;
  role?: Role;
}

export interface SkillData {
  skillId: string;
  level?: SkillLevel;
  verified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findProfiles(role?: string) {
    const whereClause = role ? { role: role as Role } : {};
    
    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // Enhanced profile fields (will test gradually)
        bio: true,
        title: true,
        location: true,
        hourlyRate: true,
        availability: true,
        reputation: {
          select: {
            score: true,
            completedProjects: true,
            averageRating: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            invoicesAsFreelancer: true,
            invoicesAsClient: true,
            linksFrom: true,
            linksTo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        reputation: true,
        skills: {
          include: {
            skill: true,
          },
        },
        _count: {
          select: {
            invoicesAsFreelancer: true,
            invoicesAsClient: true,
            linksFrom: true,
            linksTo: true,
            skills: true,
            projects: true,
          },
        },
      },
    });
    
    if (!user) throw new NotFoundException('User not found');
    
    // Transform to match frontend expectations
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bio: user.bio,
      title: user.title,
      location: user.location,
      hourly_rate: user.hourlyRate,
      availability: user.availability,
      walletAddress: user.walletAddress,
      created_at: user.createdAt,
      updatedAt: user.updatedAt,
      skills: user.skills,
      user_stats: {
        completed_projects: user.reputation?.completedProjects || 0,
        total_projects: user._count.projects,
        total_invoices: user._count.invoicesAsFreelancer + user._count.invoicesAsClient,
        average_rating: user.reputation?.averageRating || 0,
        completion_rate: user.reputation?.completedProjects && user._count.projects > 0 
          ? (user.reputation.completedProjects / user._count.projects) * 100 
          : 0,
        total_earnings: 0, // TODO: Calculate from actual earnings data
      },
      portfolio: [], // TODO: Add portfolio when implemented
      reputation: user.reputation,
    };
  }

  async update(id: string, data: Partial<{ name: string }>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async me(id: string) {
    return this.findById(id);
  }

  // Profile Management Methods
  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        title: true,
        location: true,
        hourlyRate: true,
        availability: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reputation: true,
        skills: {
          include: {
            skill: true,
          },
        },
        _count: {
          select: {
            invoicesAsFreelancer: true,
            invoicesAsClient: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return only public fields
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      bio: user.bio,
      title: user.title,
      location: user.location,
      hourlyRate: user.hourlyRate,
      availability: user.availability,
      createdAt: user.createdAt,
      reputation: user.reputation,
      skills: user.skills,
      _count: user._count,
    };
  }

  async getUserSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
      },
    });
  }

  async addUserSkill(userId: string, data: SkillData) {
    // Validate skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id: data.skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check if user already has this skill
    const existingUserSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: data.skillId,
        },
      },
    });

    if (existingUserSkill) {
      throw new BadRequestException('User already has this skill');
    }

    return this.prisma.userSkill.create({
      data: {
        userId,
        skillId: data.skillId,
        level: data.level || SkillLevel.INTERMEDIATE,
        verified: data.verified || false,
      },
      include: {
        skill: true,
      },
    });
  }

  async updateUserSkill(
    userId: string,
    skillId: string,
    data: Partial<SkillData>,
  ) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    return this.prisma.userSkill.update({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      data: {
        level: data.level,
        verified: data.verified,
      },
      include: {
        skill: true,
      },
    });
  }

  async removeUserSkill(userId: string, skillId: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    await this.prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    return { success: true };
  }

  // User Statistics
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        reputation: true,
        _count: {
          select: {
            invoicesAsFreelancer: true,
            invoicesAsClient: true,
            skills: true,
            projects: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalInvoices:
        user._count.invoicesAsFreelancer + user._count.invoicesAsClient,
      skillsCount: user._count.skills,
      projectsCount: user._count.projects,
      reputation: user.reputation,
      joinedAt: user.createdAt,
    };
  }

  // Skills catalog
  async getAllSkills() {
    return this.prisma.skill.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}
