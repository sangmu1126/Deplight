import 'package:cloud_firestore/cloud_firestore.dart';

class Workspace {
  final String id;
  final String name;
  final String description;
  final String ownerUid;
  final List<String> members;
  final Timestamp createdAt;

  Workspace({
    required this.id,
    required this.name,
    required this.description,
    required this.ownerUid,
    required this.members,
    required this.createdAt,
  });

  // (★★★★★ 신규 ★★★★★: Socket.io가 보낸 Map용)
  factory Workspace.fromMap(Map<String, dynamic> data) {
    return Workspace(
      id: data['id'], // (server.js가 id를 포함해서 보냄)
      name: data['name'] ?? 'Untitled Workspace',
      description: data['description'] ?? 'No description',
      ownerUid: data['ownerUid'] ?? '',
      members: List<String>.from(data['members'] ?? []),
      // (Socket.io는 Timestamp 대신 String을 보낼 수 있으므로 변환 필요)
      createdAt: (data['createdAt'] is Timestamp)
          ? data['createdAt']
          : Timestamp.now(), // (간단한 타입 체크)
    );
  }
}