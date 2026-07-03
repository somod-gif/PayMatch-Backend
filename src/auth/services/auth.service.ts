import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from '../dto/create-auth.dto';
import * as bcrypt from 'bcrypt';

/**
 * Authentication service.
 * Handles Business Owner registration and login.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new Business Owner (Merchant).
   * Creates business owner record with hashed password.
   */
  async register(dto: RegisterDto) {
    this.logger.log(`Registering business owner: ${dto.email}`);

    // Check if business owner already exists
    const existingOwner = await this.prisma.businessOwner.findUnique({
      where: { email: dto.email },
    });

    if (existingOwner) {
      throw new ConflictException('Business owner with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create business owner
    const businessOwner = await this.prisma.businessOwner.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        businessName: dto.businessName,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    this.logger.log(`Business owner registered successfully: ${businessOwner.id}`);

    return {
      success: true,
      message: 'Business owner registration successful',
      data: businessOwner,
    };
  }

  /**
   * Authenticates Business Owner login.
   * Validates credentials and returns business owner data.
   */
  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);

    // Find business owner
    const businessOwner = await this.prisma.businessOwner.findUnique({
      where: { email: dto.email },
    });

    if (!businessOwner) {
      throw new NotFoundException('Business owner not found. Please register first.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, businessOwner.password);

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid credentials');
    }

    // Check if account is active
    if (businessOwner.status !== 'active') {
      throw new NotFoundException('Account is not active. Please contact support.');
    }

    this.logger.log(`Login successful: ${businessOwner.id}`);

    // Return business owner data (exclude password)
    const { password, ...ownerWithoutPassword } = businessOwner;

    return {
      success: true,
      message: 'Login successful',
      data: ownerWithoutPassword,
    };
  }

  /**
   * Validates business owner exists and is active
   * Used for authentication middleware
   */
  async validateBusinessOwner(businessOwnerId: string) {
    const businessOwner = await this.prisma.businessOwner.findUnique({
      where: { id: businessOwnerId },
      select: {
        id: true,
        email: true,
        businessName: true,
        status: true,
      },
    });

    if (!businessOwner || businessOwner.status !== 'active') {
      return null;
    }

    return businessOwner;
  }
}