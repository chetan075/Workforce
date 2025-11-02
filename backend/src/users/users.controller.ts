import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddSkillDto, UpdateSkillDto } from './dto/skill.dto';

// Type for authenticated request
interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // Admin endpoint - list all users
  @Get()
  async getUsers(@Query('role') role?: string) {
    return await this.users.findProfiles(role);
  }

  // Admin endpoint - list user profiles (same as above, keeping for backwards compatibility)
  @Get('profiles')
  async getProfiles(@Query('role') role?: string) {
    return await this.users.findProfiles(role);
  }

  // === PROFILE MANAGEMENT ENDPOINTS ===

  // Get current user's profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.users.findById(req.user.sub);
  }

  // Update current user's profile
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.users.updateProfile(req.user.sub, updateData);
  }

  // Get current user's statistics
  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Request() req: AuthenticatedRequest) {
    return this.users.getUserStats(req.user.sub);
  }

  // === SKILLS MANAGEMENT ENDPOINTS ===

  // Get all available skills
  @Get('skills')
  async getAllSkills() {
    return this.users.getAllSkills();
  }

  // Get current user's skills
  @Get('me/skills')
  @UseGuards(JwtAuthGuard)
  async getMySkills(@Request() req: AuthenticatedRequest) {
    return this.users.getUserSkills(req.user.sub);
  }

  // Add a skill to current user's profile
  @Post('me/skills')
  @UseGuards(JwtAuthGuard)
  async addMySkill(
    @Request() req: AuthenticatedRequest,
    @Body() skillData: AddSkillDto,
  ) {
    return this.users.addUserSkill(req.user.sub, skillData);
  }

  // Update current user's skill
  @Put('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  async updateMySkill(
    @Request() req: AuthenticatedRequest,
    @Param('skillId') skillId: string,
    @Body() skillData: UpdateSkillDto,
  ) {
    return this.users.updateUserSkill(req.user.sub, skillId, skillData);
  }

  // Remove a skill from current user's profile
  @Delete('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  async removeMySkill(
    @Request() req: AuthenticatedRequest,
    @Param('skillId') skillId: string,
  ) {
    return this.users.removeUserSkill(req.user.sub, skillId);
  }

  // === PUBLIC PROFILE ENDPOINTS ===

  // Public endpoint - get any user's public profile
  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    return this.users.getPublicProfile(id);
  }

  // Public endpoint - get any user's basic info (keeping for backwards compatibility)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.users.findById(id);
  }
}
