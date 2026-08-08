import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart'; // (수정) import 추가
import '../models/user_data.dart'; // (수정) import 추가 (경로는 실제 위치에 맞게 조정하세요)
// import 'package:intl/intl.dart'; // (선택) 날짜 포매팅을 위해 필요할 수 있습니다.

class ProfilePage extends StatelessWidget {
  final VoidCallback onGoBackToDashboard;
  final User currentUser; // (수정) Firebase 유저 정보
  final UserData? userData; // (수정) Firestore 유저 정보 (null일 수 있음)

  const ProfilePage({
    Key? key,
    required this.onGoBackToDashboard,
    required this.currentUser, // (수정) 생성자에 추가
    required this.userData, // (수정) 생성자에 추가
  }) : super(key: key);

  // --- 이미지 기준 색상 정의 ---
  static const Color _backgroundColor = Color(0xFFF9FAFB);
  static const Color _cardColor = Colors.white;
  static const Color _textColor = Color(0xFF111827);
  static const Color _subTextColor = Color(0xFF6B7280);
  static const Color _borderColor = Color(0xFFE5E7EB);
  static const Color _dangerColor = Color(0xFFEF4444);
  static const Color _primaryColor = Color(0xFF678AFB);
  static const Color _avatarBgColor = Color(0xFFE0E7FF);

  // (신규) 날짜 포매팅 헬퍼
  String _formatTimestamp(Timestamp? timestamp) {
    if (timestamp == null) return "정보 없음";
    // (간단한 포매팅)
    return timestamp.toDate().toLocal().toString().split(' ')[0];
    // (복잡한 포매팅 예시: intl 패키지 필요)
    // return DateFormat('yyyy.MM.dd').format(timestamp.toDate().toLocal());
  }

  // (신규) 날짜 포매팅 헬퍼 (DateTime)
  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return "정보 없음";
    // (간단한 포매팅)
    return dateTime.toLocal().toString().split('.')[0]; // 밀리초 제외
    // (복잡한 포매팅 예시: intl 패키지 필요)
    // return DateFormat('yyyy.MM.dd HH:mm').format(dateTime.toLocal());
  }


  @override
  Widget build(BuildContext context) {
    // TopBar가 app_core에 있으므로 이 페이지는 Scaffold가 없습니다.
    return Container(
      color: _backgroundColor,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 48.0, vertical: 24.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                const SizedBox(height: 24),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 6,
                      child: _buildLeftColumn(context),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      flex: 4,
                      child: _buildRightColumn(context),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- 1. 페이지 헤더 (프로필 설정 + 뒤로가기) ---
  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "프로필 설정",
              style: theme.textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold, color: _textColor),
            ),
            const SizedBox(height: 4),
            Text(
              "개인 정보와 계정 설정을 관리하세요",
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: _subTextColor),
            ),
          ],
        ),
        TextButton.icon(
          onPressed: onGoBackToDashboard,
          icon: const Icon(Icons.arrow_back, size: 16, color: _primaryColor),
          label: const Text("대시보드로 돌아가기"),
          style: TextButton.styleFrom(
            foregroundColor: _primaryColor,
          ),
        ),
      ],
    );
  }

  // --- 2-1. 왼쪽 컬럼 빌더 ---
  Widget _buildLeftColumn(BuildContext context) {
    return Column(
      children: [
        _buildBasicInfoCard(context),
        const SizedBox(height: 24),
        _buildNotificationCard(context),
      ],
    );
  }

  // --- 2-2. 오른쪽 컬럼 빌더 ---
  Widget _buildRightColumn(BuildContext context) {
    return Column(
      children: [
        _buildSecurityCard(context),
        const SizedBox(height: 24),
        _buildAccountCard(context),
        const SizedBox(height: 24),
        // (수정) _buildActivityCard에 데이터 전달
        _buildActivityCard(context),
      ],
    );
  }

  // --- 카드 공통 스타일 헬퍼 ---
  Widget _buildBaseCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borderColor),
      ),
      child: child,
    );
  }

  // --- 카드 헤더 헬퍼 ---
  Widget _buildCardHeader(BuildContext context, String title, {Widget? action}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.bold, color: _textColor),
        ),
        if (action != null) action,
      ],
    );
  }

  // --- "기본 정보" 카드 ---
  Widget _buildBasicInfoCard(BuildContext context) {
    // (수정) UserData 모델 기반으로 변수 수정
    final String displayName = userData?.displayName ?? currentUser.displayName ?? "사용자";
    final String email = currentUser.email ?? "이메일 없음";
    final String initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : "U";
    final String role = userData?.role ?? "user"; // (수정) "부서" 대신 "역할"
    final String phone = "정보 없음"; // (수정) 모델에 없으므로
    // final String position = "정보 없음"; // (수정) 모델에 없으므로
    // final String bio = "정보 없음"; // (수정) 모델에 없으므로

    return _buildBaseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCardHeader(
            context,
            "기본 정보",
            action: TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.edit, size: 16, color: _primaryColor),
              label: const Text("편집"),
              style: TextButton.styleFrom(foregroundColor: _primaryColor),
            ),
          ),
          const Divider(color: _borderColor, height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 아바타
              CircleAvatar(
                radius: 32,
                backgroundColor: _avatarBgColor,
                child: Text(
                  initial, // (수정)
                  style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: _primaryColor),
                ),
              ),
              const SizedBox(width: 24),
              // 정보 그리드
              Expanded(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildInfoPair("이름", displayName)), // (수정)
                        Expanded(
                            child: _buildInfoPair(
                                "이메일",
                                email, // (수정)
                                subtitle: "이메일은 변경할 수 없습니다")),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                            child: _buildInfoPair("전화번호", phone)), // (수정)
                        Expanded(child: _buildInfoPair("역할", role)), // (수정) "부서" -> "역할"
                      ],
                    ),
                    // (수정) 직책, 소개 필드가 없으므로 해당 Row들 제거
                  ],
                ),
              ),
            ],
          ),
          // (수정) 소개 섹션 제거
          // const Divider(color: _borderColor, height: 32),
          // _buildInfoPair("소개", bio),
        ],
      ),
    );
  }

  // "기본 정보" 카드 내부 헬퍼 (라벨 + 값)
  Widget _buildInfoPair(String label, String value, {String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: _subTextColor),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w500, color: _textColor),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 12, color: _subTextColor),
          ),
        ]
      ],
    );
  }

  // --- "알림 설정" 카드 ---
  Widget _buildNotificationCard(BuildContext context) {
    // (이 카드는 데이터 연동 없이 하드코딩된 상태로 둡니다. 필요시 수정하세요.)
    return _buildBaseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCardHeader(context, "알림 설정"),
          const SizedBox(height: 8),
          _buildSwitchTile(
            "배포 알림",
            "앱 배포 상태 변경 시 알림을 받습니다",
            true,
                (val) {},
          ),
          _buildSwitchTile(
            "시스템 알림",
            "시스템 오류 및 중요 이벤트 알림",
            true,
                (val) {},
          ),
          _buildSwitchTile(
            "주간 리포트",
            "매주 앱 사용량 및 성능 리포트",
            false,
                (val) {},
          ),
          _buildSwitchTile(
            "이메일 알림",
            "이메일로 알림을 받습니다",
            true,
                (val) {},
          ),
          _buildSwitchTile(
            "Slack 알림",
            "Slack 채널로 알림을 받습니다",
            false,
            null, // (disabled)
          ),
        ],
      ),
    );
  }

  // "알림 설정" 카드 헬퍼 (스위치 타일)
  Widget _buildSwitchTile(
      String title, String subtitle, bool value, Function(bool)? onChanged) {
    return SwitchListTile(
      title: Text(title,
          style: const TextStyle(fontWeight: FontWeight.w500, color: _textColor)),
      subtitle:
      Text(subtitle, style: const TextStyle(color: _subTextColor)),
      value: value,
      onChanged: onChanged,
      activeColor: _primaryColor,
      inactiveThumbColor: _subTextColor,
      controlAffinity: ListTileControlAffinity.trailing,
      contentPadding: EdgeInsets.zero,
    );
  }

  // --- "보안 설정" 카드 ---
  Widget _buildSecurityCard(BuildContext context) {
    // (이 카드는 데이터 연동 없이 하드코딩된 상태로 둡니다.)
    return _buildBaseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCardHeader(context, "보안 설정"),
          const SizedBox(height: 8),
          _buildSwitchTile("2단계 인증", "추가 보안을 위한 2FA", false, (val) {}),
          const SizedBox(height: 16),
          const Text(
            "세션 타임아웃",
            style: TextStyle(fontWeight: FontWeight.w500, color: _textColor),
          ),
          const SizedBox(height: 8),
          // 드롭다운
          DropdownButtonFormField<String>(
            value: "1시간",
            items: ["30분", "1시간", "8시간", "24시간"]
                .map((label) =>
                DropdownMenuItem(child: Text(label), value: label))
                .toList(),
            onChanged: (val) {},
            decoration: InputDecoration(
              filled: true,
              fillColor: _backgroundColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: _borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: _borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: _primaryColor),
              ),
              contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
          ),
          const SizedBox(height: 16),
          // API 키
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "API 키",
                style: TextStyle(fontWeight: FontWeight.w500, color: _textColor),
              ),
              const Text("2개", style: TextStyle(color: _subTextColor)),
            ],
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () {},
            child: const Text("API 키 관리"),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 40),
              foregroundColor: _textColor,
              side: const BorderSide(color: _borderColor),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }

  // --- "계정 관리" 카드 ---
  Widget _buildAccountCard(BuildContext context) {
    // (이 카드는 데이터 연동 없이 하드코딩된 상태로 둡니다.)
    return _buildBaseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCardHeader(context, "계정 관리"),
          const SizedBox(height: 16),
          _buildAccountButton("비밀번호 변경", Icons.lock_outline),
          const SizedBox(height: 12),
          _buildAccountButton("데이터 내보내기", Icons.download_outlined),
          const SizedBox(height: 12),
          _buildAccountButton(
            "계정 삭제",
            Icons.delete_outline,
            isDanger: true,
          ),
        ],
      ),
    );
  }

  // "계정 관리" 헬퍼 (버튼)
  Widget _buildAccountButton(String label, IconData icon,
      {bool isDanger = false}) {
    final color = isDanger ? _dangerColor : _textColor;
    final borderColor = isDanger ? _dangerColor : _borderColor;

    return OutlinedButton.icon(
      onPressed: () {},
      icon: Icon(icon, size: 18, color: color),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 44),
        foregroundColor: color,
        side: BorderSide(color: borderColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  // --- "활동 요약" 카드 ---
  Widget _buildActivityCard(BuildContext context) {
    // (수정) 하드코딩된 값 대신 실제 데이터 사용
    final String lastLogin = _formatDateTime(currentUser.metadata.lastSignInTime);
    final String joinDate = _formatTimestamp(userData?.createdAt);

    return _buildBaseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCardHeader(context, "활동 요약"),
          const SizedBox(height: 16),
          _buildActivityRow("총 배포 횟수", "N/A"), // (수정) 데이터 없음
          const Divider(color: _borderColor, height: 16),
          _buildActivityRow("활성 앱", "N/A"), // (수정) 데이터 없음
          const Divider(color: _borderColor, height: 16),
          _buildActivityRow("마지막 로그인", lastLogin), // (수정)
          const Divider(color: _borderColor, height: 16),
          _buildActivityRow("가입일", joinDate), // (수정)
        ],
      ),
    );
  }

  // "활동 요약" 헬퍼 (Key-Value Row)
  Widget _buildActivityRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: _subTextColor)),
          Text(
            value,
            style: const TextStyle(
                fontWeight: FontWeight.w500, color: _textColor),
          ),
        ],
      ),
    );
  }
}