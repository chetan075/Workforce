import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import { ProjectStatus, DifficultyLevel } from '@prisma/client';

export interface CreateProjectDto {
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  difficulty?: DifficultyLevel;
  deadline?: string;
  skillIds?: string[];
  freelancerId?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  budget?: number;
  actualCost?: number;
  currency?: string;
  status?: ProjectStatus;
  difficulty?: DifficultyLevel;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  freelancerId?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  order: number;
}

export interface ProjectTimeEntry {
  id: string;
  description: string;
  hours: number;
  date: Date;
  hourlyRate?: number;
  billable: boolean;
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Create new project
  async createProject(createProjectDto: CreateProjectDto, clientId: string) {
    const { skillIds, ...projectData } = createProjectDto;

    try {
      // Validate skills exist if skillIds are provided
      if (skillIds && skillIds.length > 0) {
        const existingSkills = await this.prisma.skill.findMany({
          where: { id: { in: skillIds } }
        });
        
        if (existingSkills.length !== skillIds.length) {
          const foundSkillIds = existingSkills.map(skill => skill.id);
          const missingSkillIds = skillIds.filter(id => !foundSkillIds.includes(id));
          throw new BadRequestException(`Skills not found: ${missingSkillIds.join(', ')}`);
        }
      }

      // Validate freelancer exists if provided
      if (createProjectDto.freelancerId) {
        const freelancer = await this.prisma.user.findUnique({
          where: { id: createProjectDto.freelancerId, role: 'FREELANCER' }
        });
        
        if (!freelancer) {
          throw new BadRequestException('Freelancer not found');
        }
      }

      const project = await this.prisma.project.create({
        data: {
          ...projectData,
          clientId,
          deadline: createProjectDto.deadline ? new Date(createProjectDto.deadline) : null,
          skills: skillIds && skillIds.length > 0 ? {
            create: skillIds.map(skillId => ({
              skillId,
              required: true
            }))
          } : undefined
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          freelancer: {
            select: { id: true, name: true, email: true }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
      });

      return project;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating project:', error);
      throw new BadRequestException('Failed to create project. Please check your input data.');
    }
  }

  // Get all projects for a user (client or freelancer)
  async getProjects(
    userId: string, 
    role: 'client' | 'freelancer' | 'all' = 'all',
    status?: ProjectStatus,
    limit = 20,
    offset = 0
  ) {
    const where: any = {};

    if (role === 'client') {
      where.clientId = userId;
    } else if (role === 'freelancer') {
      where.freelancerId = userId;
    } else {
      where.OR = [
        { clientId: userId },
        { freelancerId: userId }
      ];
    }

    if (status) {
      where.status = status;
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, profileImage: true }
        },
        freelancer: {
          select: { id: true, name: true, email: true, profileImage: true }
        },
        skills: {
          include: {
            skill: true
          }
        },
        reviews: {
          include: {
            author: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });

    return projects;
  }

  // Get project by ID
  async getProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            profileImage: true,
            reputation: true
          }
        },
        freelancer: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            profileImage: true,
            reputation: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        reviews: {
          include: {
            author: {
              select: { id: true, name: true, profileImage: true }
            }
          }
        },
        invoice: true
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to this project
    if (project.clientId !== userId && project.freelancerId !== userId) {
      throw new ForbiddenException('Access denied to this project');
    }

    return project;
  }

  // Update project
  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, freelancerId: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only client or assigned freelancer can update
    if (project.clientId !== userId && project.freelancerId !== userId) {
      throw new ForbiddenException('Access denied to update this project');
    }

    try {
      const updatedProject = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          ...updateProjectDto,
          startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : undefined,
          endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : undefined,
          deadline: updateProjectDto.deadline ? new Date(updateProjectDto.deadline) : undefined,
          updatedAt: new Date()
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          freelancer: {
            select: { id: true, name: true, email: true }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
      });

      return updatedProject;
    } catch (error) {
      throw new BadRequestException('Failed to update project');
    }
  }

  // Assign freelancer to project
  async assignFreelancer(projectId: string, freelancerId: string, clientId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, status: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.clientId !== clientId) {
      throw new ForbiddenException('Only project client can assign freelancers');
    }

    if (project.status !== 'PLANNING') {
      throw new BadRequestException('Can only assign freelancers to projects in planning stage');
    }

    // Verify freelancer exists
    const freelancer = await this.prisma.user.findUnique({
      where: { id: freelancerId, role: 'FREELANCER' }
    });

    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        freelancerId,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        freelancer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return updatedProject;
  }

  // Complete project
  async completeProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, freelancerId: true, status: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.clientId !== userId && project.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (project.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Can only complete projects that are in progress');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        freelancer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return updatedProject;
  }

  // Cancel project
  async cancelProject(projectId: string, userId: string, reason?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, status: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.clientId !== userId) {
      throw new ForbiddenException('Only project client can cancel projects');
    }

    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel completed or already cancelled projects');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        updatedAt: new Date()
      }
    });

    return updatedProject;
  }

  // Get project statistics for dashboard
  async getProjectStats(userId: string) {
    const [clientProjects, freelancerProjects] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: { clientId: userId },
        _count: { status: true }
      }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: { freelancerId: userId },
        _count: { status: true }
      })
    ]);

    const [totalEarnings, totalSpent] = await Promise.all([
      this.prisma.project.aggregate({
        where: { 
          freelancerId: userId,
          status: 'COMPLETED'
        },
        _sum: { actualCost: true }
      }),
      this.prisma.project.aggregate({
        where: { 
          clientId: userId,
          status: 'COMPLETED'
        },
        _sum: { actualCost: true }
      })
    ]);

    return {
      asClient: {
        projects: clientProjects.reduce((acc, curr) => {
          acc[curr.status.toLowerCase()] = curr._count.status;
          return acc;
        }, {} as Record<string, number>),
        totalSpent: totalSpent._sum.actualCost || 0
      },
      asFreelancer: {
        projects: freelancerProjects.reduce((acc, curr) => {
          acc[curr.status.toLowerCase()] = curr._count.status;
          return acc;
        }, {} as Record<string, number>),
        totalEarnings: totalEarnings._sum.actualCost || 0
      }
    };
  }

  // Search projects
  async searchProjects(
    query: string,
    userId?: string,
    filters?: {
  status?: ProjectStatus;
      minBudget?: number;
      maxBudget?: number;
      skills?: string[];
  difficulty?: DifficultyLevel;
    }
  ) {
    const where: any = {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } }
      ]
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.minBudget || filters?.maxBudget) {
      where.budget = {};
      if (filters.minBudget) where.budget.gte = filters.minBudget;
      if (filters.maxBudget) where.budget.lte = filters.maxBudget;
    }

    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters?.skills && filters.skills.length > 0) {
      where.skills = {
        some: {
          skillId: { in: filters.skills }
        }
      };
    }

    // If user is provided, only show projects they have access to
    if (userId) {
      where.OR = [
        { clientId: userId },
        { freelancerId: userId },
        { status: 'PLANNING', freelancerId: null } // Available opportunities
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, profileImage: true }
        },
        freelancer: {
          select: { id: true, name: true, profileImage: true }
        },
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    return projects;
  }

  // Mock milestone management (would require additional models in production)
  async getProjectMilestones(projectId: string, userId: string): Promise<ProjectMilestone[]> {
    // Verify user has access to project
    await this.getProject(projectId, userId);

    // Mock data - in production, this would be stored in a separate Milestone model
    return [
      {
        id: '1',
        title: 'Project Setup & Planning',
        description: 'Initial project setup, requirements gathering, and planning phase',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        order: 1,
        completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        title: 'Design & Wireframes',
        description: 'Create initial designs and wireframes for approval',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        order: 2
      },
      {
        id: '3',
        title: 'Development Phase 1',
        description: 'Core functionality development',
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'pending',
        order: 3
      },
      {
        id: '4',
        title: 'Testing & Deployment',
        description: 'Final testing and deployment to production',
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        status: 'pending',
        order: 4
      }
    ];
  }

  // Mock time tracking (would require additional models in production)
  async getProjectTimeEntries(projectId: string, userId: string): Promise<ProjectTimeEntry[]> {
    // Verify user has access to project
    await this.getProject(projectId, userId);

    // Mock data - in production, this would be stored in a separate TimeEntry model
    return [
      {
        id: '1',
        description: 'Initial project setup and environment configuration',
        hours: 3.5,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        hourlyRate: 75,
        billable: true
      },
      {
        id: '2',
        description: 'Requirements analysis and documentation',
        hours: 4,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hourlyRate: 75,
        billable: true
      },
      {
        id: '3',
        description: 'Database schema design',
        hours: 2.5,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        hourlyRate: 75,
        billable: true
      },
      {
        id: '4',
        description: 'Team meeting and progress review',
        hours: 1,
        date: new Date(),
        billable: false
      }
    ];
  }
}