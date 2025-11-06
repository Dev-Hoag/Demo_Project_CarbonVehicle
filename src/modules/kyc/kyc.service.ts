import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from '../../shared/entities/kyc-document.entity';
import { User } from '../../shared/entities/user.entity';
import { UploadKycDocumentDto, VerifyKycDto } from '../../shared/dtos/kyc.dto';
import { KycStatus } from '../../shared/enums/user.enums';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycDocument)
    private readonly kycRepo: Repository<KycDocument>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
        uploadedAt: d.createdAt,
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

    // Update user KYC status if all documents approved
    const allDocs = await this.kycRepo.find({ where: { userId: doc.userId } });
    const allApproved = allDocs.every((d) => d.status === KycStatus.APPROVED);

    if (allApproved && allDocs.length > 0) {
      await this.userRepo.update(doc.userId, { kycStatus: KycStatus.APPROVED });
    }

    return doc;
  }
}