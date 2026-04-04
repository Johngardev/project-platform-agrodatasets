/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // req.user viene AUTOMÁTICAMENTE desde tu JwtStrategy.validate()
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 1. Verifica Token, 2. Verifica Rol
  @Roles('ADMIN')
  @Get('admin-only')
  getAdminData() {
    return {
      message: 'Bienvenido al panel de administración. Datos sensibles aquí.',
    };
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ACTUALIZAR (Patch es para actualizaciones parciales)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Lógica de seguridad:
    // Un usuario normal solo puede modificar SU propio perfil.
    // Un ADMIN puede modificar a cualquiera.

    const usuarioSolicitante = req.user;

    if (
      usuarioSolicitante.role !== 'ADMIN' &&
      usuarioSolicitante.userId !== id
    ) {
      throw new ForbiddenException(
        'No puedes modificar el perfil de otro usuario',
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  // ELIMINAR
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') // Solo el ADMIN puede borrar usuarios de la BD
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
