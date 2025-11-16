import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { PurchaseListingDto } from './dto/create-transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';

@ApiTags('Transactions')
@Controller('api/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('listings/:listingId/purchase')
  @ApiOperation({ summary: 'Purchase a listing' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  @ApiResponse({ status: 201, description: 'Purchase completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient balance or invalid data' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async purchaseListing(
    @Param('listingId') listingId: string,
    @Body() purchaseDto: PurchaseListingDto,
  ): Promise<Transaction> {
    return await this.transactionService.purchaseListing(listingId, purchaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.transactionService.findAll(page, limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getRecent(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Transaction[]> {
    return await this.transactionService.getRecent(limit);
  }

  @Get('buyer/:buyerId')
  @ApiOperation({ summary: 'Get transactions by buyer ID' })
  @ApiParam({ name: 'buyerId', description: 'Buyer User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByBuyer(
    @Param('buyerId') buyerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.transactionService.findByBuyer(buyerId, page, limit);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get transactions by seller ID' })
  @ApiParam({ name: 'sellerId', description: 'Seller User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.transactionService.findBySeller(sellerId, page, limit);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get transactions by status' })
  @ApiParam({ name: 'status', enum: TransactionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByStatus(
    @Param('status') status: TransactionStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.transactionService.findByStatus(status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async findById(@Param('id') id: string): Promise<Transaction> {
    return await this.transactionService.findById(id);
  }

  // ========== Statistics Endpoints ==========

  @Get('seller/:sellerId/revenue')
  @ApiOperation({ summary: 'Get seller revenue statistics' })
  @ApiParam({ name: 'sellerId', description: 'Seller User ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-12-31' })
  async getSellerRevenue(
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.transactionService.getSellerRevenue(sellerId, start, end);
  }

  @Get('buyer/:buyerId/spending')
  @ApiOperation({ summary: 'Get buyer spending statistics' })
  @ApiParam({ name: 'buyerId', description: 'Buyer User ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getBuyerSpending(
    @Param('buyerId') buyerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.transactionService.getBuyerSpending(buyerId, start, end);
  }

  @Get('buyer/:buyerId/co2-purchased')
  @ApiOperation({ summary: 'Get buyer CO2 purchased amount' })
  @ApiParam({ name: 'buyerId', description: 'Buyer User ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getBuyerCO2(
    @Param('buyerId') buyerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.transactionService.getBuyerCO2Purchased(buyerId, start, end);
  }

  @Get('seller/:sellerId/co2-sold')
  @ApiOperation({ summary: 'Get seller CO2 sold amount' })
  @ApiParam({ name: 'sellerId', description: 'Seller User ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getSellerCO2(
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.transactionService.getSellerCO2Sold(sellerId, start, end);
  }
}
