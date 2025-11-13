import logger from '../config/logger';
import disputeRepository from '../repositories/DisputeRepository';
import transactionRepository from '../repositories/TransactionRepository';
import { 
  TransactionDispute, 
  DisputeStatus, 
  CreateDisputeDTO,
  TransactionStatus
} from '../types/transaction';

export class DisputeService {
  
  async createDispute(data: CreateDisputeDTO): Promise<TransactionDispute> {
    logger.info('Creating dispute', { data });
    
    try {
      // Validate transaction exists
      const transaction = await transactionRepository.findById(data.transaction_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if dispute already exists
      const existingDispute = await disputeRepository.findByTransactionId(data.transaction_id);
      if (existingDispute && existingDispute.status !== DisputeStatus.CLOSED) {
        throw new Error('Active dispute already exists for this transaction');
      }

      // Validate raised_by is buyer or seller
      if (data.raised_by !== transaction.buyer_id && data.raised_by !== transaction.seller_id) {
        throw new Error('Only buyer or seller can raise dispute');
      }

      // Create dispute
      const dispute = await disputeRepository.create(data);
      
      // Update transaction status to DISPUTED
      await transactionRepository.updateStatus(data.transaction_id, TransactionStatus.DISPUTED);

      logger.info('Dispute created successfully', { dispute_id: dispute.id });
      return dispute;
    } catch (error) {
      logger.error('Error creating dispute', { error, data });
      throw error;
    }
  }

  async getDispute(id: number): Promise<TransactionDispute | null> {
    try {
      return await disputeRepository.findById(id);
    } catch (error) {
      logger.error('Error fetching dispute', { error, id });
      throw error;
    }
  }

  async getDisputeByTransactionId(transaction_id: number): Promise<TransactionDispute | null> {
    try {
      return await disputeRepository.findByTransactionId(transaction_id);
    } catch (error) {
      logger.error('Error fetching dispute by transaction', { error, transaction_id });
      throw error;
    }
  }

  async getUserDisputes(user_id: number, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const disputes = await disputeRepository.findByRaisedBy(user_id, limit, offset);
      return { disputes, limit, offset };
    } catch (error) {
      logger.error('Error fetching user disputes', { error, user_id });
      throw error;
    }
  }

  async getOpenDisputes(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const disputes = await disputeRepository.findByStatus(DisputeStatus.OPEN, limit, offset);
      const total = await disputeRepository.countByStatus(DisputeStatus.OPEN);
      return { disputes, total, limit, offset };
    } catch (error) {
      logger.error('Error fetching open disputes', { error });
      throw error;
    }
  }

  async getActiveDisputes(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const disputes = await disputeRepository.getActiveDisputes(limit, offset);
      return { disputes, limit, offset };
    } catch (error) {
      logger.error('Error fetching active disputes', { error });
      throw error;
    }
  }

  async resolveDispute(
    dispute_id: number,
    resolution: string,
    resolved_by: number
  ): Promise<void> {
    logger.info('Resolving dispute', { dispute_id, resolution, resolved_by });
    
    try {
      const dispute = await disputeRepository.findById(dispute_id);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (dispute.status === DisputeStatus.CLOSED) {
        throw new Error('Dispute already closed');
      }

      // Update dispute status
      await disputeRepository.updateStatus(
        dispute_id,
        DisputeStatus.RESOLVED,
        resolution,
        resolved_by
      );

      logger.info('Dispute resolved', { dispute_id });
    } catch (error) {
      logger.error('Error resolving dispute', { error, dispute_id });
      throw error;
    }
  }

  async closeDispute(dispute_id: number): Promise<void> {
    logger.info('Closing dispute', { dispute_id });
    
    try {
      const dispute = await disputeRepository.findById(dispute_id);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      await disputeRepository.updateStatus(dispute_id, DisputeStatus.CLOSED);
      logger.info('Dispute closed', { dispute_id });
    } catch (error) {
      logger.error('Error closing dispute', { error, dispute_id });
      throw error;
    }
  }

  async getAllDisputes(limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const disputes = await disputeRepository.findAll(limit, offset);
      return { disputes, limit, offset };
    } catch (error) {
      logger.error('Error fetching all disputes', { error });
      throw error;
    }
  }
}

export default new DisputeService();

