import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { MetricDaily } from '../../shared/entities/metric-daily.entity';
import { AuditLog } from '../../shared/entities/audit-log.entity';
import { AdminUser } from '../../shared/entities/admin-user.entity';
import { ManagedUser, ManagedUserStatus } from '../../shared/entities/managed-user.entity';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { ReportFilterDto, ReportPeriod, DashboardSummaryDto, TrendDataDto } from '../../shared/dtos/report.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(MetricDaily)
    private readonly metricRepo: Repository<MetricDaily>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(ManagedUser)
    private readonly userRepo: Repository<ManagedUser>,
    @InjectRepository(ManagedTransaction)
    private readonly transactionRepo: Repository<ManagedTransaction>,
  ) {}

  // ========== DASHBOARD SUMMARY ==========

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    // Try to get latest metric from MetricDaily
    const latestMetric = await this.metricRepo.findOne({
      where: {},
      order: { metricDate: 'DESC' },
    });

    if (latestMetric) {
      // Use pre-aggregated data (FAST)
      return {
        overview: {
          totalUsers: latestMetric.totalUsers,
          activeUsers: latestMetric.totalActiveUsers,
          suspendedUsers: latestMetric.totalSuspendedUsers,
          evOwners: latestMetric.totalEvOwners,
          buyers: latestMetric.totalBuyers,
          verifiers: latestMetric.totalVerifiers,
        },
        credits: {
          totalIssued: parseFloat(latestMetric.totalCreditsIssued.toString()),
          totalTraded: parseFloat(latestMetric.totalCreditsTraded.toString()),
          totalCo2Reduced: parseFloat(latestMetric.totalCo2Reduced.toString()),
        },
        financial: {
          totalRevenue: parseFloat(latestMetric.totalRevenue.toString()),
          totalFeeCollected: parseFloat(latestMetric.totalFeeCollected.toString()),
          totalTransactions: latestMetric.totalTransactions,
        },
        timestamp: latestMetric.metricDate,
      };
    }

    // Fallback: No metric data yet, aggregate real-time (SLOW)
    this.logger.warn('No MetricDaily data found. Aggregating real-time (slow).');
    return this.aggregateRealTimeMetrics();
  }

  private async aggregateRealTimeMetrics(): Promise<DashboardSummaryDto> {
    const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { status: ManagedUserStatus.ACTIVE } }),
      this.userRepo.count({ where: { status: ManagedUserStatus.SUSPENDED } }),
    ]);

    const [totalTransactions] = await Promise.all([
      this.transactionRepo.count(),
    ]);

    const revenueResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where("t.status = 'COMPLETED'")
      .getRawOne();

    return {
      overview: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        evOwners: 0, // TODO: Count by userType
        buyers: 0,
        verifiers: 0,
      },
      credits: {
        totalIssued: 0,
        totalTraded: 0,
        totalCo2Reduced: 0,
      },
      financial: {
        totalRevenue: parseFloat(revenueResult?.total || '0'),
        totalFeeCollected: 0,
        totalTransactions,
      },
      timestamp: new Date().toISOString().split('T')[0],
    };
  }

  // ========== TRANSACTION TREND ==========

  async getTransactionTrend(filter: ReportFilterDto): Promise<TrendDataDto[]> {
    const { startDate, endDate } = this.getDateRange(filter);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Try to get from MetricDaily first
    const metrics = await this.metricRepo.find({
      where: {
        metricDate: Between(startDateStr, endDateStr),
      },
      order: { metricDate: 'ASC' },
    });

    if (metrics.length > 0) {
      // Use pre-aggregated data
      return metrics.map((m) => ({
        date: m.metricDate,
        value: m.totalTransactions,
        label: `${m.totalTransactions} transactions`,
      }));
    }

    // Fallback: Real-time aggregation
    this.logger.warn('No MetricDaily data. Aggregating transactions real-time.');
    const rawData = await this.transactionRepo
      .createQueryBuilder('t')
      .select('DATE(t.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('t.createdAt >= :start', { start: startDate })
      .andWhere('t.createdAt <= :end', { end: endDate })
      .groupBy('DATE(t.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rawData.map((row) => ({
      date: row.date,
      value: parseInt(row.count),
      label: `${row.count} transactions`,
    }));
  }

  // ========== USER GROWTH ==========

  async getUserGrowth(filter: ReportFilterDto): Promise<TrendDataDto[]> {
    const { startDate, endDate } = this.getDateRange(filter);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const metrics = await this.metricRepo.find({
      where: {
        metricDate: Between(startDateStr, endDateStr),
      },
      order: { metricDate: 'ASC' },
    });

    if (metrics.length > 0) {
      return metrics.map((m) => ({
        date: m.metricDate,
        value: m.totalUsers,
        label: `${m.totalUsers} total users`,
      }));
    }

    // Fallback: Calculate from managed_user
    this.logger.warn('No MetricDaily data. Calculating user growth real-time.');
    const rawData = await this.userRepo
      .createQueryBuilder('u')
      .select('DATE(u.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('u.createdAt >= :start', { start: startDate })
      .andWhere('u.createdAt <= :end', { end: endDate })
      .groupBy('DATE(u.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    let cumulative = await this.userRepo.count({
      where: { createdAt: LessThanOrEqual(startDate) },
    });

    return rawData.map((row) => {
      cumulative += parseInt(row.count);
      return {
        date: row.date,
        value: cumulative,
        label: `${cumulative} total users`,
      };
    });
  }

  // ========== CO2 IMPACT REPORT ==========

  async getCo2ImpactReport(filter: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filter);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const metrics = await this.metricRepo.find({
      where: {
        metricDate: Between(startDateStr, endDateStr),
      },
      order: { metricDate: 'ASC' },
    });

    if (metrics.length === 0) {
      return {
        totalCo2Reduced: 0,
        totalCreditsIssued: 0,
        totalCreditsTraded: 0,
        dailyTrend: [],
      };
    }

    const totalCo2Reduced = metrics.reduce(
      (sum, m) => sum + parseFloat(m.totalCo2Reduced.toString()),
      0,
    );
    const totalCreditsIssued = metrics.reduce(
      (sum, m) => sum + parseFloat(m.totalCreditsIssued.toString()),
      0,
    );
    const totalCreditsTraded = metrics.reduce(
      (sum, m) => sum + parseFloat(m.totalCreditsTraded.toString()),
      0,
    );

    return {
      totalCo2Reduced: totalCo2Reduced.toFixed(4),
      totalCreditsIssued: totalCreditsIssued.toFixed(4),
      totalCreditsTraded: totalCreditsTraded.toFixed(4),
      dailyTrend: metrics.map((m) => ({
        date: m.metricDate,
        co2Reduced: parseFloat(m.totalCo2Reduced.toString()),
        creditsIssued: parseFloat(m.totalCreditsIssued.toString()),
        creditsTraded: parseFloat(m.totalCreditsTraded.toString()),
      })),
    };
  }

  // ========== REVENUE REPORT ==========

  async getRevenueReport(filter: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filter);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const metrics = await this.metricRepo.find({
      where: {
        metricDate: Between(startDateStr, endDateStr),
      },
      order: { metricDate: 'ASC' },
    });

    if (metrics.length === 0) {
      return {
        totalRevenue: 0,
        totalFeeCollected: 0,
        dailyRevenue: [],
      };
    }

    const totalRevenue = metrics.reduce(
      (sum, m) => sum + parseFloat(m.totalRevenue.toString()),
      0,
    );
    const totalFeeCollected = metrics.reduce(
      (sum, m) => sum + parseFloat(m.totalFeeCollected.toString()),
      0,
    );

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalFeeCollected: totalFeeCollected.toFixed(2),
      dailyRevenue: metrics.map((m) => ({
        date: m.metricDate,
        revenue: parseFloat(m.totalRevenue.toString()),
        fee: parseFloat(m.totalFeeCollected.toString()),
        transactions: m.totalTransactions,
      })),
    };
  }

  // ========== ADMIN ACTION SUMMARY ==========

  async getAdminActionSummary(filter: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filter);

    const totalActions = await this.auditLogRepo.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    // Top actions
    const topActions = await this.auditLogRepo
      .createQueryBuilder('a')
      .select('a.actionName', 'actionName')
      .addSelect('a.resourceType', 'resourceType')
      .addSelect('COUNT(*)', 'count')
      .where('a.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('a.actionName')
      .addGroupBy('a.resourceType')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topAdmins = await this.auditLogRepo
      .createQueryBuilder('a')
      .leftJoin('admin_user', 'admin', 'admin.id = a.admin_user_id')
      .select('a.admin_user_id', 'adminId')   // ✅
      .addSelect('admin.username', 'username')
      .addSelect('COUNT(*)', 'actionCount')
      .where('a.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('a.admin_user_id')             // ✅
      .addGroupBy('admin.username')
      .orderBy('actionCount', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalActions,
      topActions: topActions.map((a) => ({
        action: a.actionName,
        resourceType: a.resourceType,
        count: parseInt(a.count),
      })),
      topAdmins: topAdmins.map((a) => ({
        adminId: a.adminId,
        username: a.username || 'Unknown',
        actionCount: parseInt(a.actionCount),
      })),
    };
  }

  // ========== HELPER: Date Range Calculation ==========

  private getDateRange(filter: ReportFilterDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (filter.period) {
      case ReportPeriod.TODAY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;

      case ReportPeriod.YESTERDAY:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.LAST_7_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;

      case ReportPeriod.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;

      case ReportPeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case ReportPeriod.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.CUSTOM:
        if (filter.startDate && filter.endDate) {
          startDate = new Date(filter.startDate);
          endDate = new Date(filter.endDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
        }
        break;

      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }
}