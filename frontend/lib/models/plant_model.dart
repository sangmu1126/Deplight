import 'logEntry_model.dart';

class Plant {
  // --- Firestore DB에서 오는 핵심 데이터 ---
  final String id;
  final String ownerUid;
  final String workspaceId;
  final String description;

  // 이 값들은 서버 이벤트('plant-update')에 따라 변경되어야 함
  String plantType;
  String version;
  String status;
  List<String> reactions;

  // --- 앱에서 관리하는 로컬 상태 ---
  List<LogEntry> logs = [];
  String aiInsight = 'AI 분석 대기 중...';
  String currentStatusMessage = '대기 중';
  bool isSparkling = false;

  Plant({
    required this.id,
    required this.plantType,
    required this.version,
    required this.description,
    required this.status,
    required this.ownerUid,
    required this.workspaceId,
    required this.reactions,
  });
}