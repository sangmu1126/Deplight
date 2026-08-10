class UserData {
  final String uid;
  final String email;
  final String displayName;
  final String role;
  final dynamic createdAt; // local mode: use dynamic instead of Timestamp

  UserData({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    required this.createdAt,
  });

  factory UserData.fromFirestore(dynamic doc) {
    Map<String, dynamic> data = doc is Map ? doc as Map<String, dynamic> : doc.data() as Map<String, dynamic>;
    dynamic rawDate = data['createdAt'];
    DateTime date;
    if (rawDate is String) {
      date = DateTime.tryParse(rawDate) ?? DateTime.now();
    } else if (rawDate is DateTime) {
      date = rawDate;
    } else {
      date = DateTime.now();
    }

    return UserData(
      uid: doc is Map ? (data['uid'] ?? 'unknown') : doc.id,
      email: data['email'] ?? '',
      displayName: data['displayName'] ?? 'New User',
      role: data['role'] ?? 'user',
      createdAt: date,
    );
  }
}
