import { Request, Response } from 'express';
import logger from '../config/logger';
import disputeService from '../services/DisputeService';
import { CreateDisputeDTO } from '../types/transaction';

export class DisputeController {
  
  async createDispute(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id, raised_by, reason, description } = req.body;

      const data: CreateDisputeDTO = {
        transaction_id,
        raised_by,
        reason,
        description
      };

      const dispute = await disputeService.createDispute(data);

      res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute created successfully'
      });
    } catch (error) {
      logger.error('Error in createDispute', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getDispute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dispute = await disputeService.getDispute(parseInt(id));

      if (!dispute) {
        res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispute
      });
    } catch (error) {
      logger.error('Error in getDispute', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getDisputeByTransactionId(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.params;
      const dispute = await disputeService.getDisputeByTransactionId(parseInt(transaction_id));

      if (!dispute) {
        res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dispute
      });
    } catch (error) {
      logger.error('Error in getDisputeByTransactionId', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getUserDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const result = await disputeService.getUserDisputes(
        parseInt(user_id),
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getUserDisputes', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getOpenDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const result = await disputeService.getOpenDisputes(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getOpenDisputes', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getActiveDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const result = await disputeService.getActiveDisputes(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getActiveDisputes', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async resolveDispute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolution, resolved_by } = req.body;

      await disputeService.resolveDispute(parseInt(id), resolution, resolved_by);

      res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully'
      });
    } catch (error) {
      logger.error('Error in resolveDispute', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async closeDispute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await disputeService.closeDispute(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Dispute closed successfully'
      });
    } catch (error) {
      logger.error('Error in closeDispute', { error });
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  async getAllDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const result = await disputeService.getAllDisputes(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getAllDisputes', { error });
      res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

export default new DisputeController();

