import { Request, Response } from 'express';
import logger from '../config/logger';
import transactionService from '../services/TransactionService';
import { CreateTransactionDTO } from '../types/transaction';

export class TransactionController {
  
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { listing_id, buyer_id, seller_id, credit_amount, price_per_credit, total_price, currency } = req.body;

      const data: CreateTransactionDTO = {
        listing_id,
        buyer_id,
        seller_id,
        credit_amount,
        price_per_credit,
        total_price,
        currency
      };

      const transaction = await transactionService.createTransaction(data);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      logger.error('Error in createTransaction', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransaction(parseInt(id));

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error in getTransaction', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const summary = await transactionService.getTransactionSummary(parseInt(id));

      if (!summary) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error in getTransactionSummary', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getBuyerTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { buyer_id } = req.params;
      const { limit = '20', offset = '0' } = req.query;

      const result = await transactionService.getBuyerTransactions(
        parseInt(buyer_id),
        Math.max(1, parseInt(limit as string) || 20),
        Math.max(0, parseInt(offset as string) || 0)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getBuyerTransactions', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getSellerTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { seller_id } = req.params;
      const { limit = '20', offset = '0' } = req.query;

      const result = await transactionService.getSellerTransactions(
        parseInt(seller_id),
        Math.max(1, parseInt(limit as string) || 20),
        Math.max(0, parseInt(offset as string) || 0)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getSellerTransactions', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async updateTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      await transactionService.updateTransactionStatus(parseInt(id), status, reason);

      res.status(200).json({
        success: true,
        message: 'Transaction status updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateTransactionStatus', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async cancelTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await transactionService.cancelTransaction(parseInt(id), reason);

      res.status(200).json({
        success: true,
        message: 'Transaction cancelled successfully'
      });
    } catch (error) {
      logger.error('Error in cancelTransaction', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async handlePaymentCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.body;

      await transactionService.handlePaymentCompleted(transaction_id);

      res.status(200).json({
        success: true,
        message: 'Payment completed handled successfully'
      });
    } catch (error) {
      logger.error('Error in handlePaymentCompleted', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async handlePaymentFailed(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.body;

      await transactionService.handlePaymentFailed(transaction_id);

      res.status(200).json({
        success: true,
        message: 'Payment failed handled successfully'
      });
    } catch (error) {
      logger.error('Error in handlePaymentFailed', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

export default new TransactionController();

