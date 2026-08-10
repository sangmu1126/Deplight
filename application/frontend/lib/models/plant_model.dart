// models/plant_model.dart
import 'logEntry_model.dart'; 

class Plant {
  final String id;
  final String githubUrl; 
  final String ownerUid;
  final String workspaceId;

  String name; 
  String status;
  dynamic lastDeployedAt; // Timestamp 대신 dynamic 사용 (local mode)
  double cpuUsage;
  double memUsage;
  String plantType;
  List<String> reactions;
  String? runId; 

  bool isSparkling;
  String currentStatusMessage;
  List<LogEntry> logs; 
  String aiInsight; 

  Plant({
    required this.id,
    required this.githubUrl,
    required this.name,
    required this.status,
    required this.lastDeployedAt,
    required this.cpuUsage,
    required this.memUsage,
    this.plantType = 'pot',
    this.ownerUid = '',
    this.workspaceId = '',
    this.reactions = const [],
    this.runId,
    this.isSparkling = false,
    this.currentStatusMessage = '',
    this.logs = const [], 
    this.aiInsight = '배포 완료됨.', 
  });

  factory Plant.fromMap(Map<String, dynamic> data) {
    dynamic rawDate = data['lastDeployedAt'];
    DateTime date;
    if (rawDate is String) {
      date = DateTime.tryParse(rawDate) ?? DateTime.now();
    } else if (rawDate is DateTime) {
      date = rawDate;
    } else if (rawDate is Map && rawDate.containsKey('toDate')) {
      // Handle fake Firebase object if sent
      date = DateTime.now(); 
    } else {
      date = DateTime.now();
    }

    return Plant(
      id: data['id'],
      name: data['name'] ?? data['version'] ?? 'Unnamed App',
      githubUrl: data['githubUrl'] ?? data['description'] ?? '',
      status: data['status'] ?? 'UNKNOWN',
      lastDeployedAt: date,
      cpuUsage: (data['cpuUsage'] ?? 0.0).toDouble(),
      memUsage: (data['memUsage'] ?? 0.0).toDouble(),
      workspaceId: data['workspaceId'] ?? '',
      ownerUid: data['ownerUid'] ?? '',
      plantType: data['plantType'] ?? 'pot',
      reactions: List<String>.from(data['reactions'] ?? []),
      runId: data['runId'],
      currentStatusMessage: data['status'] == 'HEALTHY' ? '배포 완료됨' : '대기 중',
      logs: [],
    );
  }
}
