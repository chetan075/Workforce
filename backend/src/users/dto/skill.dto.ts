import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class AddSkillDto {
  @IsString()
  skillId: string;

  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class UpdateSkillDto {
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}