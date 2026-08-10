class Workspace {
  final String id;
  final String name;
  final String description;
  final String ownerUid;
  final List<String> members;
  final dynamic createdAt; // local mode: use dynamic instead of Timestamp

  Workspace({
    required this.id,
    required this.name,
    required this.description,
    required this.ownerUid,
    required this.members,
    required this.createdAt,
  });

  factory Workspace.fromMap(Map<String, dynamic> data) {
    dynamic rawDate = data['createdAt'];
    DateTime date;
    if (rawDate is String) {
      date = DateTime.tryParse(rawDate) ?? DateTime.now();
    } else if (rawDate is DateTime) {
      date = rawDate;
    } else {
      date = DateTime.now();
    }

    return Workspace(
      id: data['id'],
      name: data['name'] ?? 'Untitled Workspace',
      description: data['description'] ?? 'No description',
      ownerUid: data['ownerUid'] ?? '',
      members: List<String>.from(data['members'] ?? []),
      createdAt: date,
    );
  }
}
