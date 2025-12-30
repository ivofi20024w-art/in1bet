export type OperationalLogSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export type OperationalLogType = 
  | "AUTO_WITHDRAW_LIMIT_EXCEEDED"
  | "AUTO_WITHDRAW_FAILED"
  | "AUTO_WITHDRAW_SUCCESS"
  | "AFFILIATE_FRAUD_DETECTED"
  | "AFFILIATE_PAYOUT_CREATED"
  | "AFFILIATE_PAYOUT_RESERVED"
  | "AFFILIATE_PAYOUT_RELEASED"
  | "WEBHOOK_INVALID"
  | "WEBHOOK_SIGNATURE_FAILED"
  | "BALANCE_OPERATION_FAILED"
  | "KYC_VERIFICATION_SUBMITTED"
  | "CONVERSION_MATURATION_PENDING"
  | "BET_PLACED"
  | "BET_WON"
  | "BET_LOST"
  | "BET_CANCELLED";

interface OperationalLogEntry {
  type: OperationalLogType;
  severity: OperationalLogSeverity;
  entityType?: string;
  entityId?: string;
  userId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export function logOperational(entry: OperationalLogEntry): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: entry.severity,
    type: entry.type,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userId: entry.userId,
    message: entry.message,
    metadata: entry.metadata,
  };

  const logPrefix = `[OPERATIONAL][${entry.severity}][${entry.type}]`;
  
  switch (entry.severity) {
    case "CRITICAL":
      console.error(`${logPrefix}`, JSON.stringify(logEntry));
      break;
    case "ERROR":
      console.error(`${logPrefix}`, JSON.stringify(logEntry));
      break;
    case "WARN":
      console.warn(`${logPrefix}`, JSON.stringify(logEntry));
      break;
    case "INFO":
    default:
      console.log(`${logPrefix}`, JSON.stringify(logEntry));
      break;
  }
}

export function logAutoWithdrawLimitExceeded(
  userId: string,
  withdrawalId: string,
  amount: number,
  maxAmount: number
): void {
  logOperational({
    type: "AUTO_WITHDRAW_LIMIT_EXCEEDED",
    severity: "WARN",
    entityType: "WITHDRAWAL",
    entityId: withdrawalId,
    userId,
    message: `Auto-withdraw blocked: R$ ${amount.toFixed(2)} exceeds max R$ ${maxAmount.toFixed(2)}`,
    metadata: { amount, maxAmount, exceededBy: amount - maxAmount },
  });
}

export function logAutoWithdrawFailed(
  userId: string,
  withdrawalId: string,
  reason: string
): void {
  logOperational({
    type: "AUTO_WITHDRAW_FAILED",
    severity: "ERROR",
    entityType: "WITHDRAWAL",
    entityId: withdrawalId,
    userId,
    message: `Auto-withdraw failed: ${reason}`,
    metadata: { reason },
  });
}

export function logAutoWithdrawSuccess(
  userId: string,
  withdrawalId: string,
  amount: number
): void {
  logOperational({
    type: "AUTO_WITHDRAW_SUCCESS",
    severity: "INFO",
    entityType: "WITHDRAWAL",
    entityId: withdrawalId,
    userId,
    message: `Auto-withdraw processed: R$ ${amount.toFixed(2)}`,
    metadata: { amount },
  });
}

export function logAffiliateFraudDetected(
  conversionId: string,
  affiliateId: string,
  userId: string,
  reasons: string[]
): void {
  logOperational({
    type: "AFFILIATE_FRAUD_DETECTED",
    severity: "WARN",
    entityType: "AFFILIATE_CONVERSION",
    entityId: conversionId,
    userId,
    message: `Fraud detected in affiliate conversion`,
    metadata: { affiliateId, reasons },
  });
}

export function logAffiliatePayoutCreated(
  payoutId: string,
  affiliateId: string,
  amount: number
): void {
  logOperational({
    type: "AFFILIATE_PAYOUT_CREATED",
    severity: "INFO",
    entityType: "AFFILIATE_PAYOUT",
    entityId: payoutId,
    message: `Affiliate payout requested: R$ ${amount.toFixed(2)}`,
    metadata: { affiliateId, amount },
  });
}

export function logAffiliatePayoutReserved(
  payoutId: string,
  affiliateId: string,
  amount: number
): void {
  logOperational({
    type: "AFFILIATE_PAYOUT_RESERVED",
    severity: "INFO",
    entityType: "AFFILIATE_PAYOUT",
    entityId: payoutId,
    message: `Affiliate balance reserved: R$ ${amount.toFixed(2)}`,
    metadata: { affiliateId, amount },
  });
}

export function logAffiliatePayoutReleased(
  payoutId: string,
  affiliateId: string,
  amount: number,
  reason: string
): void {
  logOperational({
    type: "AFFILIATE_PAYOUT_RELEASED",
    severity: "INFO",
    entityType: "AFFILIATE_PAYOUT",
    entityId: payoutId,
    message: `Affiliate balance released: R$ ${amount.toFixed(2)} - ${reason}`,
    metadata: { affiliateId, amount, reason },
  });
}

export function logWebhookInvalid(
  source: string,
  reason: string,
  payload?: unknown
): void {
  logOperational({
    type: "WEBHOOK_INVALID",
    severity: "WARN",
    entityType: "WEBHOOK",
    message: `Invalid webhook from ${source}: ${reason}`,
    metadata: { source, reason, payloadPreview: payload ? JSON.stringify(payload).slice(0, 200) : undefined },
  });
}

export function logWebhookSignatureFailed(
  source: string,
  expectedSignature?: string
): void {
  logOperational({
    type: "WEBHOOK_SIGNATURE_FAILED",
    severity: "ERROR",
    entityType: "WEBHOOK",
    message: `Webhook signature verification failed from ${source}`,
    metadata: { source },
  });
}

export function logBalanceOperationFailed(
  userId: string,
  operation: string,
  amount: number,
  error: string
): void {
  logOperational({
    type: "BALANCE_OPERATION_FAILED",
    severity: "CRITICAL",
    entityType: "WALLET",
    userId,
    message: `Balance operation failed: ${operation} R$ ${amount.toFixed(2)}`,
    metadata: { operation, amount, error },
  });
}
