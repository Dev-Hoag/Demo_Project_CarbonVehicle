import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Transaction, TransactionStatus, TransactionType } from './transaction.entity';
import { CreateTransactionDto, PurchaseListingDto } from './dto/create-transaction.dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { CreditPurchasedEvent } from '../events/credit-purchased.event';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly walletServiceUrl: string;
  private readonly creditServiceUrl: string;
  private readonly listingServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private httpService: HttpService,
    private configService: ConfigService,
    private eventPublisher: EventPublisherService,
  ) {
    this.walletServiceUrl = this.configService.get('WALLET_SERVICE_URL', 'http://wallet-service:3008');
    this.creditServiceUrl = this.configService.get('CREDIT_SERVICE_URL', 'http://credit-service:8093');
    this.listingServiceUrl = this.configService.get('LISTING_SERVICE_URL', 'http://listing-service:8092');
    this.internalApiKey = this.configService.get('INTERNAL_API_KEY', 'internal-secret-key-2024');
  }

  /**
   * Main purchase logic - handles the complete transaction flow
   */
  async purchaseListing(listingId: string, purchaseDto: PurchaseListingDto): Promise<Transaction> {
    this.logger.log(`Processing purchase for listing ${listingId} by buyer ${purchaseDto.buyerId}`);

    // Step 1: Get listing details
    const listing = await this.getListingDetails(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    if (listing.status !== 'ACTIVE') {
      throw new BadRequestException(`Listing ${listingId} is not active`);
    }

    if (purchaseDto.amount > listing.co2Amount) {
      throw new BadRequestException(
        `Requested amount ${purchaseDto.amount} kg exceeds available ${listing.co2Amount} kg`,
      );
    }

    // Prevent self-purchase
    if (listing.sellerId === purchaseDto.buyerId) {
      throw new BadRequestException('Cannot purchase your own listing');
    }

    // Extract numeric userId from UUID format (00000000-0000-0000-0000-000000000039 -> 39)
    const buyerNumericId = this.extractNumericUserId(purchaseDto.buyerId);
    const sellerNumericId = this.extractNumericUserId(listing.sellerId);

    const totalPrice = purchaseDto.amount * listing.pricePerKg;

    // Step 2: Check buyer wallet balance
    const buyerWallet = await this.getWalletBalance(buyerNumericId);
    if (buyerWallet.balance < totalPrice) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalPrice} VND, Available: ${buyerWallet.balance} VND`,
      );
    }

    // Step 3: Create transaction record (PENDING)
    const transaction = this.transactionRepository.create({
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId: purchaseDto.buyerId,
      amount: purchaseDto.amount,
      pricePerKg: listing.pricePerKg,
      totalPrice: totalPrice,
      transactionType: TransactionType.DIRECT_PURCHASE,
      status: TransactionStatus.PENDING,
      notes: purchaseDto.notes,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    try {
      // Step 4a: Reserve funds (lock buyer's money)
      await this.reservePayment(savedTransaction.id, buyerNumericId, totalPrice);

      // Step 4b: Settle payment (transfer from buyer to seller)
      await this.settlePayment(savedTransaction.id, buyerNumericId, sellerNumericId, totalPrice);

      // Step 6: Transfer credits from seller to buyer
      await this.transferCredits(listing.sellerId, purchaseDto.buyerId, purchaseDto.amount);

      // Step 7: Update listing status
      const remainingAmount = listing.co2Amount - purchaseDto.amount;
      if (remainingAmount <= 0) {
        await this.updateListingStatus(listingId, 'SOLD', listing);
      } else {
        await this.updateListingAmount(listingId, remainingAmount, listing);
      }

      // Step 8: Mark transaction as completed
      savedTransaction.status = TransactionStatus.COMPLETED;
      await this.transactionRepository.save(savedTransaction);

      // Step 9: Publish credit.purchased event for Certificate Service
      try {
        const event = new CreditPurchasedEvent({
          transactionId: savedTransaction.id,
          listingId: listing.id,
          buyerId: purchaseDto.buyerId,
          sellerId: listing.sellerId,
          creditAmount: purchaseDto.amount,
          totalPrice: totalPrice,
          pricePerKg: listing.pricePerKg,
          purchasedAt: savedTransaction.createdAt,
          tripId: listing.tripId, // May be undefined for non-trip listings
        });
        
        await this.eventPublisher.publishCreditPurchased(event);
        this.logger.log(`✅ Published credit.purchased event for transaction ${savedTransaction.id}`);
      } catch (error) {
        this.logger.error(`❌ Failed to publish event for transaction ${savedTransaction.id}`, error);
        // Don't fail transaction if event publishing fails
      }

      this.logger.log(`Transaction ${savedTransaction.id} completed successfully`);
      return savedTransaction;
    } catch (error) {
      // Rollback: Mark transaction as failed
      savedTransaction.status = TransactionStatus.FAILED;
      savedTransaction.notes = `${savedTransaction.notes || ''}\nError: ${error.message}`;
      await this.transactionRepository.save(savedTransaction);

      this.logger.error(`Transaction ${savedTransaction.id} failed: ${error.message}`);
      throw new InternalServerErrorException(
        `Transaction failed: ${error.message}. Please contact support with transaction ID: ${savedTransaction.id}`,
      );
    }
  }

  /**
   * Get listing details from Listing Service
   */
  private async getListingDetails(listingId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.listingServiceUrl}/listings/${listingId}`),
      );
      return response.data.data; // Extract data from ApiResponse wrapper
    } catch (error) {
      this.logger.error(`Failed to get listing ${listingId}: ${error.message}`);
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
  }

  /**
   * Get wallet balance from Wallet Service
   */
  private async getWalletBalance(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.walletServiceUrl}/internal/wallets/${userId}/balance`, {
          headers: {
            'x-internal-api-key': this.internalApiKey,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get wallet for user ${userId}: ${error.message}`);
      throw new BadRequestException(`Unable to retrieve wallet information`);
    }
  }

  /**
   * Reserve funds (lock buyer's money before settlement)
   */
  private async reservePayment(
    transactionId: string,
    userId: string,
    amount: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.walletServiceUrl}/internal/wallets/reserve`,
          {
            transactionId,
            userId,
            amount,
            expirationMinutes: 30, // Reserve expires in 30 minutes if not settled
          },
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );
      this.logger.log(`Funds reserved successfully for transaction ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to reserve funds for transaction ${transactionId}: ${error.message}`,
      );
      throw new InternalServerErrorException(`Failed to reserve payment funds`);
    }
  }

  /**
   * Settle payment atomically between buyer and seller
   */
  private async settlePayment(
    transactionId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.walletServiceUrl}/internal/wallets/settle`,
          {
            transactionId,
            buyerId,
            sellerId,
            amount,
          },
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );
      this.logger.log(`Payment settled successfully for transaction ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to settle payment for transaction ${transactionId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to settle payment between buyer ${buyerId} and seller ${sellerId}`,
      );
    }
  }

  /**
   * Transfer credits between users
   */
  private async transferCredits(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.creditServiceUrl}/api/v1/credits/transfer`, {
          fromUserId,
          toUserId,
          amount,
          description: 'Credit purchase transaction',
        }),
      );
      this.logger.log(`Credits transferred successfully from ${fromUserId} to ${toUserId}`);
    } catch (error) {
      this.logger.error(`Failed to transfer credits: ${error.message}`);
      throw new InternalServerErrorException(`Failed to transfer credits`);
    }
  }

  /**
   * Update listing status
   */
  private async updateListingStatus(listingId: string, status: string, listing: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(`${this.listingServiceUrl}/listings/${listingId}`, {
          sellerId: listing.sellerId,
          title: listing.title,
          description: listing.description,
          pricePerKg: listing.pricePerKg,
          status,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to update listing ${listingId} status: ${error.message}`);
      throw new InternalServerErrorException(`Failed to update listing status`);
    }
  }

  /**
   * Update listing CO2 amount
   */
  private async updateListingAmount(listingId: string, co2Amount: number, listing: any): Promise<void> {
    try {
      // Note: Listing Service doesn't support partial amount updates in UpdateListingRequest
      // For now, we'll update the status to reflect it's been partially purchased
      await firstValueFrom(
        this.httpService.put(`${this.listingServiceUrl}/listings/${listingId}`, {
          sellerId: listing.sellerId,
          title: listing.title,
          description: listing.description,
          pricePerKg: listing.pricePerKg,
          status: 'ACTIVE', // Keep active if there's remaining stock
        }),
      );
      this.logger.log(`Listing ${listingId} partially purchased, ${co2Amount} kg remaining`);
    } catch (error) {
      this.logger.error(`Failed to update listing ${listingId} amount: ${error.message}`);
      throw new InternalServerErrorException(`Failed to update listing amount`);
    }
  }

  // ========== Query Methods ==========

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Transaction[]; total: number }> {
    const [data, total] = await this.transactionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }

  async findByBuyer(buyerId: string, page: number = 1, limit: number = 10): Promise<{ data: Transaction[]; total: number }> {
    const [data, total] = await this.transactionRepository.findAndCount({
      where: { buyerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findBySeller(sellerId: string, page: number = 1, limit: number = 10): Promise<{ data: Transaction[]; total: number }> {
    const [data, total] = await this.transactionRepository.findAndCount({
      where: { sellerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findByStatus(status: TransactionStatus, page: number = 1, limit: number = 10): Promise<{ data: Transaction[]; total: number }> {
    const [data, total] = await this.transactionRepository.findAndCount({
      where: { status },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async getRecent(limit: number = 10): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  // ========== Statistics Methods ==========

  async getSellerRevenue(sellerId: string, startDate?: Date, endDate?: Date): Promise<{ revenue: number; transactionCount: number }> {
    const query = this.transactionRepository.createQueryBuilder('t')
      .select('SUM(t.totalPrice)', 'revenue')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.sellerId = :sellerId', { sellerId })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED });

    if (startDate && endDate) {
      query.andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await query.getRawOne();
    return {
      revenue: parseFloat(result.revenue) || 0,
      transactionCount: parseInt(result.transactionCount) || 0,
    };
  }

  async getBuyerSpending(buyerId: string, startDate?: Date, endDate?: Date): Promise<{ spending: number; transactionCount: number }> {
    const query = this.transactionRepository.createQueryBuilder('t')
      .select('SUM(t.totalPrice)', 'spending')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.buyerId = :buyerId', { buyerId })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED });

    if (startDate && endDate) {
      query.andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await query.getRawOne();
    return {
      spending: parseFloat(result.spending) || 0,
      transactionCount: parseInt(result.transactionCount) || 0,
    };
  }

  async getBuyerCO2Purchased(buyerId: string, startDate?: Date, endDate?: Date): Promise<{ co2Amount: number; transactionCount: number }> {
    const query = this.transactionRepository.createQueryBuilder('t')
      .select('SUM(t.amount)', 'co2Amount')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.buyerId = :buyerId', { buyerId })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED });

    if (startDate && endDate) {
      query.andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await query.getRawOne();
    return {
      co2Amount: parseFloat(result.co2Amount) || 0,
      transactionCount: parseInt(result.transactionCount) || 0,
    };
  }

  async getSellerCO2Sold(sellerId: string, startDate?: Date, endDate?: Date): Promise<{ co2Amount: number; transactionCount: number }> {
    const query = this.transactionRepository.createQueryBuilder('t')
      .select('SUM(t.amount)', 'co2Amount')
      .addSelect('COUNT(t.id)', 'transactionCount')
      .where('t.sellerId = :sellerId', { sellerId })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED });

    if (startDate && endDate) {
      query.andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await query.getRawOne();
    return {
      co2Amount: parseFloat(result.co2Amount) || 0,
      transactionCount: parseInt(result.transactionCount) || 0,
    };
  }

  /**
   * Extract numeric userId from UUID format
   * Example: 00000000-0000-0000-0000-000000000039 -> 39
   */
  private extractNumericUserId(uuidUserId: string): string {
    // UUID format: 00000000-0000-0000-0000-{userId padded to 12 digits}
    // Extract last segment and remove leading zeros
    const parts = uuidUserId.split('-');
    if (parts.length === 5) {
      const lastPart = parts[4]; // Get the last part
      return parseInt(lastPart, 10).toString(); // Remove leading zeros
    }
    // Fallback: if not UUID format, return as-is
    return uuidUserId;
  }
}
