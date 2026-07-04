import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/create-auth.dto';
import { BusinessOwnerResponseDto, ApiResponseDto } from '../dto/auth-response.dto';

/**
 * Authentication controller.
 * Handles business owner registration and login endpoints.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new business owner' })
  @ApiResponse({ 
    status: 201, 
    description: 'Business owner registered successfully',
    type: ApiResponseDto<BusinessOwnerResponseDto>
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Business owner already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Business owner login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: ApiResponseDto<BusinessOwnerResponseDto>
  })
  @ApiResponse({ status: 404, description: 'Business owner not found' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
