import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  ProjectsService,
  CreateProjectDto,
  UpdateProjectDto,
} from './projects.service';
import { ProjectStatus, DifficultyLevel } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Create new project
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ) {
    // Basic validation
    if (!createProjectDto.title || createProjectDto.title.trim().length === 0) {
      throw new BadRequestException('Project title is required');
    }

    if (
      !createProjectDto.description ||
      createProjectDto.description.trim().length === 0
    ) {
      throw new BadRequestException('Project description is required');
    }

    if (createProjectDto.budget && createProjectDto.budget < 0) {
      throw new BadRequestException('Budget cannot be negative');
    }

    if (createProjectDto.deadline) {
      const deadlineDate = new Date(createProjectDto.deadline);
      if (deadlineDate <= new Date()) {
        throw new BadRequestException('Deadline must be in the future');
      }
    }

    return this.projectsService.createProject(
      createProjectDto,
      req.user.userId,
    );
  }

  // Get all projects for current user
  @Get()
  async getProjects(
    @Request() req: any,
    @Query('role') role?: 'client' | 'freelancer' | 'all',
    @Query('status') status?: ProjectStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.projectsService.getProjects(
      req.user.userId,
      role || 'all',
      status,
      limitNum,
      offsetNum,
    );
  }

  // Search projects
  @Get('search')
  async searchProjects(
    @Request() req: any,
    @Query('q') query: string,
    @Query('status') status?: ProjectStatus,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
    @Query('skills') skills?: string,
    @Query('difficulty') difficulty?: DifficultyLevel,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (minBudget) filters.minBudget = parseFloat(minBudget);
    if (maxBudget) filters.maxBudget = parseFloat(maxBudget);
    if (difficulty) filters.difficulty = difficulty;
    if (skills) filters.skills = skills.split(',').filter((s) => s.trim());

    return this.projectsService.searchProjects(
      query.trim(),
      req.user.userId,
      filters,
    );
  }

  // Get project statistics
  @Get('stats')
  async getProjectStats(@Request() req: any) {
    return this.projectsService.getProjectStats(req.user.userId);
  }

  // Get specific project
  @Get(':id')
  async getProject(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.getProject(id, req.user.userId);
  }

  // Update project
  @Put(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ) {
    return this.projectsService.updateProject(
      id,
      updateProjectDto,
      req.user.userId,
    );
  }

  // Assign freelancer to project
  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignFreelancer(
    @Param('id') id: string,
    @Body('freelancerId') freelancerId: string,
    @Request() req: any,
  ) {
    if (!freelancerId) {
      throw new BadRequestException('Freelancer ID is required');
    }

    return this.projectsService.assignFreelancer(
      id,
      freelancerId,
      req.user.userId,
    );
  }

  // Complete project
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeProject(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.completeProject(id, req.user.userId);
  }

  // Cancel project
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelProject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.projectsService.cancelProject(id, req.user.userId, reason);
  }

  // Get project milestones
  @Get(':id/milestones')
  async getProjectMilestones(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.getProjectMilestones(id, req.user.userId);
  }

  // Get project time entries
  @Get(':id/time-entries')
  async getProjectTimeEntries(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.getProjectTimeEntries(id, req.user.userId);
  }

  // Delete project (only for clients, only if in PLANNING status)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Param('id') id: string, @Request() req: any) {
    // Get project to check ownership and status
    const project = await this.projectsService.getProject(id, req.user.userId);

    if (project.clientId !== req.user.userId) {
      throw new BadRequestException('Only project owner can delete projects');
    }

    if (project.status !== 'PLANNING') {
      throw new BadRequestException(
        'Can only delete projects in planning stage',
      );
    }

    // Note: In production, you might want to soft delete instead
    // For now, we'll update the service to handle deletion
    throw new BadRequestException(
      'Project deletion not implemented - consider canceling instead',
    );
  }
}
