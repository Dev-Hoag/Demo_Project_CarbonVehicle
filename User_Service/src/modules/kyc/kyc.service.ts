import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from '../../shared/entities/kyc-document.entity';
import { User } from '../../shared/entities/user.entity';
import { UploadKycDocumentDto, VerifyKycDto } from '../../shared/dtos/kyc.dto';
import { KycStatus } from '../../shared/enums/user.enums';
import { UserEventPublisher } from '../events/user-event.publisher';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycDocument)
    private readonly kycRepo: Repository<KycDocument>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly userEventPublisher: UserEventPublisher,
  ) {}

  /**
   * Upload KYC document
   * - User upload file (ID card, passport, driver license, etc.)
   * - File được lưu local tại /uploads/kyc/
   * - Status mặc định là PENDING chờ admin/CVA verify
   */
  async uploadDocument(userId: number, dto: UploadKycDocumentDto, fileUrl: string) {
    const doc = this.kycRepo.create({
      userId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      fileUrl,
      status: KycStatus.PENDING,
    });

    return this.kycRepo.save(doc);
  }

  /**
   * Lấy danh sách KYC documents của user
   */
  async getMyDocuments(userId: number) {
    return this.kycRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy KYC status tổng quan của user
   * - Trạng thái KYC chung (PENDING, APPROVED, REJECTED)
   * - Danh sách documents đã upload
   */
  async getKycStatus(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const documents = await this.kycRepo.find({ where: { userId } });

    return {
      kycStatus: user.kycStatus,
      documents: documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    };
  }

  /**
   * Xóa KYC document
   * - User chỉ có thể xóa document chưa được approve
   * - Document đã approve không được xóa
   */
  async deleteDocument(userId: number, docId: number) {
    const doc = await this.kycRepo.findOne({ where: { id: docId, userId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.status === KycStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved document');
    }

    await this.kycRepo.remove(doc);
    return { message: 'Document deleted' };
  }

  /**
   * Verify KYC document (Admin/CVA only)
   * - Admin/CVA approve hoặc reject document
   * - Nếu tất cả documents được approve → user.kycStatus = APPROVED
   * - Có thể kèm rejection reason nếu reject
   */
  async verifyDocument(docId: number, verifierId: number, dto: VerifyKycDto) {
    const doc = await this.kycRepo.findOne({ where: { id: docId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    doc.status = dto.approve ? KycStatus.APPROVED : KycStatus.REJECTED;
    doc.verifiedBy = verifierId;
    doc.verifiedAt = new Date();
    doc.rejectionReason = dto.rejectionReason;

    await this.kycRepo.save(doc);

    // Update user KYC status based on documents
    const allDocs = await this.kycRepo.find({ where: { userId: doc.userId } });
    const allApproved = allDocs.every((d) => d.status === KycStatus.APPROVED);
    const hasRejected = allDocs.some((d) => d.status === KycStatus.REJECTED);

    console.log('[KYC] Updating user status:', {
      userId: doc.userId,
      totalDocs: allDocs.length,
      allApproved,
      hasRejected,
      docStatuses: allDocs.map(d => ({ id: d.id, status: d.status }))
    });

    let newKycStatus: KycStatus;
    if (allApproved && allDocs.length > 0) {
      console.log('[KYC] Setting status to APPROVED');
      newKycStatus = KycStatus.APPROVED;
      await this.userRepo.update(doc.userId, { kycStatus: KycStatus.APPROVED });
    } else if (hasRejected) {
      console.log('[KYC] Setting status to REJECTED');
      newKycStatus = KycStatus.REJECTED;
      await this.userRepo.update(doc.userId, { kycStatus: KycStatus.REJECTED });
    } else {
      console.log('[KYC] Setting status to PENDING');
      newKycStatus = KycStatus.PENDING;
      await this.userRepo.update(doc.userId, { kycStatus: KycStatus.PENDING });
    }

    // 🔥 Publish KYC status updated event to RabbitMQ for Admin Service sync
    const user = await this.userRepo.findOne({ where: { id: doc.userId } });
    if (user) {
      await this.userEventPublisher.publishKycStatusUpdated({
        userId: user.id,
        email: user.email,
        kycStatus: newKycStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
        updatedAt: new Date().toISOString(),
      });
    }

    return doc;
  }

  /**
   * Get all pending documents (for Admin)
   */
  async getPendingDocuments(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [documents, total] = await this.kycRepo.findAndCount({
      where: { status: KycStatus.PENDING },
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      documents: documents.map((doc) => ({
        ...doc,
        user: doc.user
          ? {
              id: doc.user.id,
              email: doc.user.email,
              fullName: doc.user.profile?.fullName || '',
              userType: doc.user.userType,
            }
          : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all documents with optional filter (for Admin)
   */
  async getAllDocuments(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [documents, total] = await this.kycRepo.findAndCount({
      where,
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      documents: documents.map((doc) => ({
        ...doc,
        user: doc.user
          ? {
              id: doc.user.id,
              email: doc.user.email,
              fullName: doc.user.profile?.fullName || '',
              userType: doc.user.userType,
            }
          : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get KYC statistics (for Admin)
   */
  async getKycStatistics() {
    const [totalDocuments, pendingDocuments, approvedDocuments, rejectedDocuments] =
      await Promise.all([
        this.kycRepo.count(),
        this.kycRepo.count({ where: { status: KycStatus.PENDING } }),
        this.kycRepo.count({ where: { status: KycStatus.APPROVED } }),
        this.kycRepo.count({ where: { status: KycStatus.REJECTED } }),
      ]);

    const totalUsersWithKyc = await this.kycRepo
      .createQueryBuilder('kyc')
      .select('COUNT(DISTINCT kyc.userId)', 'count')
      .getRawOne();

    const usersFullyVerified = await this.userRepo.count({
      where: { kycStatus: KycStatus.APPROVED },
    });

    return {
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      totalUsersWithKyc: parseInt(totalUsersWithKyc.count) || 0,
      usersFullyVerified,
    };
  }
}
