// app_list.dart (ShelfPage)

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:timeago/timeago.dart' as timeago; // 시간 표시 (예: "2시간 전")
import 'package:percent_indicator/percent_indicator.dart'; // 프로그레스 바

import '../models/plant_model.dart'; // (수정된 Plant 모델 임포트)
import '../models/user_data.dart';

class ShelfPage extends StatefulWidget {
  final String workspaceId;
  final String workspaceName;
  final VoidCallback onDeploy; // "+ 새 앱 배포" 버튼에 연결됨
  final Function(Plant) onPlantTap;
  final Function(String, String) onSlackReaction;
  final User currentUser;
  final UserData? userData;
  final IO.Socket socket;
  final List<dynamic> workspaces; // (TopBar용 - 현재는 사용 안함)
  final VoidCallback onCreateWorkspace;

  const ShelfPage({
    Key? key,
    required this.workspaceId,
    required this.workspaceName,
    required this.onDeploy,
    required this.onPlantTap,
    required this.onSlackReaction,
    required this.currentUser,
    this.userData,
    required this.socket,
    required this.workspaces,
    required this.onCreateWorkspace,
  }) : super(key: key);

  @override
  _ShelfPageState createState() => _ShelfPageState();
}

class _ShelfPageState extends State<ShelfPage> {
  List<Plant> shelf = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    widget.socket.on('current-shelf', _onCurrentShelf);
    widget.socket.emit('get-current-shelf', widget.workspaceId);
    timeago.setLocaleMessages('ko', timeago.KoMessages());
  }

  @override
  void dispose() {
    widget.socket.off('current-shelf', _onCurrentShelf);
    super.dispose();
  }

  // (수정) 새 Plant 모델에 맞게 리스너 콜백 업데이트
  void _onCurrentShelf(dynamic data) {
    if (!mounted) return;
    setState(() {
      shelf = (data as List)
          .map((p) => Plant.fromMap(p as Map<String, dynamic>))
          .toList();
      _isLoading = false;
    });
  }

  // (신규) 페이지 헤더 빌드
  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "앱 대시보드", //
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 4),
            Text(
              "${widget.workspaceName}의 배포된 앱들을 관리하세요", //
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        // (신규) "+ 새 앱 배포" 버튼
        ElevatedButton.icon(
          onPressed: widget.onDeploy, // AppCore의 onDeploy 함수 연결
          icon: Icon(Icons.add, size: 18),
          label: Text("새 앱 배포"),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF678AFB), // 이미지 기준 파란색
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // 로딩 중이거나 쉘프가 비어있을 때 처리
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48.0, vertical: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. 페이지 헤더 (제목 + 버튼)
          _buildHeader(context),
          SizedBox(height: 24),

          // 2. 앱 카드 그리드
          Expanded(
            child: shelf.isEmpty
                ? Center(child: Text('앱이 없습니다. "새 앱 배포"를 눌러 시작하세요.'))
                : GridView.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3, // 4열 그리드
                crossAxisSpacing: 24, // 가로 간격
                mainAxisSpacing: 24, // 세로 간격
                childAspectRatio: 1.4, // 카드 종횡비 (조절 필요)
              ),
              itemCount: shelf.length,
              itemBuilder: (context, index) {
                final plant = shelf[index];
                // (신규) 앱 대시보드 카드 위젯 사용
                return _AppDashboardCard(
                  plant: plant,
                  onTap: () => widget.onPlantTap(plant),
                  // "깨우기" 버튼 등 카드 내부 액션 (추후 구현)
                  // onWakeUp: () => ...
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// --- (신규) 이미지와 100% 동일한 앱 대시보드 카드 위젯 ---
class _AppDashboardCard extends StatelessWidget {
  final Plant plant;
  final VoidCallback onTap;

  const _AppDashboardCard({
    Key? key,
    required this.plant,
    required this.onTap,
  }) : super(key: key);

  // --- 1. 색상 및 스타일 정의 (이미지 기준) ---

  // 로고 배경 (보라색 그라데이션)
  static const Color _logoBgStart = Color(0xFF7B61FF);
  static const Color _logoBgEnd = Color(0xFF673AB7);

  // 텍스트
  static const Color _mainTextColor = Color(0xFF111827);
  static const Color _subTextColor = Color(0xFF6B7280);
  static const Color _metricsLabelColor = Color(0xFF4B5563);

  // 상태 (정상)
  static const Color _statusGreenBg = Color(0xFFE6F9F0);
  static const Color _statusGreenText = Color(0xFF00B894);

  // 프로그레스 바
  static const Color _cpuBarColor = Color(0xFF4F46E5);
  static const Color _memBarColor = Color(0xFF10B981);
  static const Color _barBgColor = Color(0xFFE5E7EB);

  // 텍스트 스타일
  static const TextStyle _appNameStyle = TextStyle(
    fontSize: 18, fontWeight: FontWeight.bold, color: _mainTextColor,
  );
  static const TextStyle _urlStyle = TextStyle(
    fontSize: 14, color: _subTextColor,
  );
  static const TextStyle _statusStyle = TextStyle(
    fontSize: 13, fontWeight: FontWeight.bold, color: _statusGreenText,
  );
  static const TextStyle _timeAgoStyle = TextStyle(
    fontSize: 14, color: _subTextColor,
  );
  static const TextStyle _metricsLabelStyle = TextStyle(
    fontSize: 14, color: _metricsLabelColor, fontWeight: FontWeight.w500,
  );
  static const TextStyle _metricsPercentStyle = TextStyle(
    fontSize: 14, fontWeight: FontWeight.bold, color: _mainTextColor,
  );

  // --- 2. 메인 Build 함수 ---
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1.5, // (약간의 그림자)
      shadowColor: Colors.black.withOpacity(0.05),
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0), // (이미지와 동일한 둥근 모서리)
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.0),
        child: Padding(
          padding: const EdgeInsets.all(20.0), // (카드 내부 여백)
          // (수정)
          // 기존 Column 구조 대신, 상태에 따라 다른 Body를 그리도록
          // _buildCardBody에서 모든 것을 처리합니다.
          child: _buildCardBody(context, plant),
        ),
      ),
    );
  }

  // --- 3. (신규) 카드 헤더 (로고, 앱 이름, URL) ---
  // (이전 코드의 _buildCardHeader를 이 코드로 대체)
  Widget _buildCardHeader() {
    return Row(
      children: [
        // --- 로고 ---
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10.0),
            gradient: const LinearGradient(
              colors: [_logoBgStart, _logoBgEnd],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Image.asset(
              'assets/plant.png', // (사용자가 요청한 경로)
              color: Colors.white,
              width: 28,
              height: 28,
            ),
          ),
        ),
        const SizedBox(width: 12),
        // --- 앱 이름, URL ---
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                plant.name, // "Frontend App"
                style: _appNameStyle,
              ),
              const SizedBox(height: 4),
              Text(
                plant.githubUrl, // "https://github.com/company/f..."
                style: _urlStyle,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- 4. (신규) 상태 칩 (정상, 시간) ---
  Widget _buildStatusRow(String timeAgo) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // --- 상태 칩 ---
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 5.0),
          decoration: BoxDecoration(
            color: _statusGreenBg,
            borderRadius: BorderRadius.circular(20.0),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle, color: _statusGreenText, size: 16),
              const SizedBox(width: 6),
              Text("정상", style: _statusStyle),
            ],
          ),
        ),
        // --- 시간 ---
        Text(timeAgo, style: _timeAgoStyle),
      ],
    );
  }

  // --- 5. (신규) 프로그레스 바 (CPU, 메모리) ---
  // (이전 코드의 _buildProgressBar를 이 코드로 대체)
  Widget _buildMetricsProgressBar({
    required String label,
    required double percent,
    required Color color,
  }) {
    final double clampedPercent = percent.clamp(0.0, 1.0);

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: _metricsLabelStyle),
            Text(
              "${(clampedPercent * 100).toInt()}%",
              style: _metricsPercentStyle,
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearPercentIndicator(
          percent: clampedPercent,
          lineHeight: 10.0,
          backgroundColor: _barBgColor,
          progressColor: color,
          barRadius: const Radius.circular(10.0),
          padding: EdgeInsets.zero,
        ),
      ],
    );
  }

  // --- 6. (유지) 다른 상태(SLEEPING 등)를 위한 기존 상태 칩 ---
  Widget _buildStatusChip(IconData icon, String label, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }

  // --- 7. (수정) 카드 본문 (모든 로직 통합) ---
  // (이전 코드의 _buildCardBody를 이 코드로 대체)
  Widget _buildCardBody(BuildContext context, Plant plant) {
    final String timeAgo = timeago.format(plant.lastDeployedAt.toDate(), locale: 'ko');

    switch (plant.status) {
    // --- (수정) HEALTHY/NORMAL일 때 신규 디자인 사용 ---
      case 'HEALTHY':
      case 'NORMAL':
        final double cpuPercent = plant.cpuUsage / 100.0;
        final double memPercent = plant.memUsage / 100.0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCardHeader(), // 신규 헤더
            const SizedBox(height: 16),
            _buildStatusRow(timeAgo), // 신규 상태 로우
            const SizedBox(height: 20),
            _buildMetricsProgressBar( // 신규 프로그레스 바
              label: "CPU",
              percent: cpuPercent,
              color: _cpuBarColor,
            ),
            const SizedBox(height: 16),
            _buildMetricsProgressBar( // 신규 프로그레스 바
              label: "메모리",
              percent: memPercent,
              color: _memBarColor,
            ),
          ],
        );

    // --- (유지) SLEEPING일 때 기존 디자인 사용 ---
      case 'SLEEPING':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCardHeader(), // 헤더만 신규 디자인으로 교체
            SizedBox(height: 16),
            _buildStatusChip(Icons.pause_circle_outline, "겨울잠", Color(0xFFFDCB6E)),
            SizedBox(height: 4),
            Text(timeAgo, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            Spacer(),
            Text("앱이 겨울잠 상태입니다", style: TextStyle(color: Colors.grey[600])),
            SizedBox(height: 8),
            ElevatedButton(
              onPressed: () { /* 깨우기 로직 (onPlantTap으로 대체) */ },
              child: Text("깨우기"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFF0F4FF),
                foregroundColor: Color(0xFF678AFB),
                elevation: 0,
              ),
            )
          ],
        );

    // --- (유지) DEPLOYING일 때 기존 디자인 사용 ---
      case 'DEPLOYING':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCardHeader(), // 헤더만 신규 디자인으로 교체
            SizedBox(height: 16),
            _buildStatusChip(Icons.sync, "배포중", Color(0xFF678AFB)),
            SizedBox(height: 4),
            Text("배포중...", style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            Spacer(),
            LinearProgressIndicator(color: Color(0xFF678AFB)),
            SizedBox(height: 4),
            Text("배포가 진행 중입니다...", style: TextStyle(color: Colors.grey[600])),
          ],
        );

    // --- (유지) FAILED일 때 기존 디자인 사용 ---
      case 'FAILED':
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCardHeader(), // 헤더만 신규 디자인으로 교체
            SizedBox(height: 16),
            _buildStatusChip(Icons.error, "오류", Color(0xFFD63031)),
            SizedBox(height: 4),
            Text(timeAgo, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            Spacer(),
            Text("배포에 실패했습니다.", style: TextStyle(color: Color(0xFFD63031))),
          ],
        );
    }
  }
}