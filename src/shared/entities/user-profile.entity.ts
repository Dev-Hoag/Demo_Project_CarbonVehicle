import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 'Vietnam' })
  country: string;

  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  // EV Owner fields
  @Column({ nullable: true, name: 'vehicle_type' })
  vehicleType: string;

  @Column({ nullable: true, name: 'vehicle_model' })
  vehicleModel: string;

  @Column({ nullable: true, name: 'vehicle_plate' })
  vehiclePlate: string;

  // Buyer fields
  @Column({ nullable: true, name: 'company_name' })
  companyName: string;

  @Column({ nullable: true, name: 'tax_code' })
  taxCode: string;

  // CVA fields
  @Column({ nullable: true, name: 'certification_number' })
  certificationNumber: string;

  @Column({ nullable: true, name: 'organization_name' })
  organizationName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
