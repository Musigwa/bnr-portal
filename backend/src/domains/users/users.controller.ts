import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role, type User } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private service: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile' })
  @Get('me')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  me(@CurrentUser() user: User) {
    const { passwordHash: _, ...result } = user;
    return result;
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'List of users' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ description: 'User found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ description: 'User updated' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }
}
