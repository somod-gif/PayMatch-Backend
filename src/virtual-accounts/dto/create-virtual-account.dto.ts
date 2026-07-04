import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVirtualAccountDto {
  @ApiProperty({ description: 'Invoice ID to create virtual account for', example: '80b92c16-358f-43fa-b79f-12a398c3e13a' })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;
}