import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletTxIdempotencyIndex1700000000001 implements MigrationInterface {
  name = 'AddWalletTxIdempotencyIndex1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IDX_wallet_tx_idem ON wallet_transactions (wallet_id, reference_type, reference_id, type)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IDX_wallet_tx_idem ON wallet_transactions`,
    );
  }
}
