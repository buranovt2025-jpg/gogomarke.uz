class Wallet {
  final String id;
  final String userId;
  final double balance;
  final String currency;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Wallet({
    required this.id,
    required this.userId,
    required this.balance,
    this.currency = 'UZS',
    this.isActive = true,
    required this.createdAt,
    this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      balance: (json['balance'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'UZS',
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : (json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now()),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : (json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'balance': balance,
      'currency': currency,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get formattedBalance => '${balance.toStringAsFixed(0)} $currency';
}

class WalletTransaction {
  final String id;
  final String walletId;
  final String type;
  final double amount;
  final double balanceBefore;
  final double balanceAfter;
  final String? description;
  final String? referenceId;
  final String? referenceType;
  final String status;
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    required this.balanceBefore,
    required this.balanceAfter,
    this.description,
    this.referenceId,
    this.referenceType,
    required this.status,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      walletId: json['walletId']?.toString() ?? json['wallet_id']?.toString() ?? '',
      type: json['type'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      balanceBefore: (json['balanceBefore'] ?? json['balance_before'] ?? 0).toDouble(),
      balanceAfter: (json['balanceAfter'] ?? json['balance_after'] ?? 0).toDouble(),
      description: json['description'],
      referenceId: json['referenceId']?.toString() ?? json['reference_id']?.toString(),
      referenceType: json['referenceType'] ?? json['reference_type'],
      status: json['status'] ?? 'completed',
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : (json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'walletId': walletId,
      'type': type,
      'amount': amount,
      'balanceBefore': balanceBefore,
      'balanceAfter': balanceAfter,
      'description': description,
      'referenceId': referenceId,
      'referenceType': referenceType,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  String get typeLabel {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'refund':
        return 'Refund';
      case 'payment':
        return 'Payment';
      case 'bonus':
        return 'Bonus';
      case 'cashback':
        return 'Cashback';
      default:
        return type;
    }
  }

  String get formattedAmount {
    final prefix = isCredit ? '+' : '-';
    return '$prefix${amount.toStringAsFixed(0)} UZS';
  }

  String get formattedDate {
    return '${createdAt.day.toString().padLeft(2, '0')}.${createdAt.month.toString().padLeft(2, '0')}.${createdAt.year}';
  }

  String get formattedTime {
    return '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  }

  bool get isCredit => type == 'deposit' || type == 'refund' || type == 'bonus' || type == 'cashback';
  bool get isDebit => type == 'withdrawal' || type == 'payment';
  bool get isPending => status == 'pending';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
}
