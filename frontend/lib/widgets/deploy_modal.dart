import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../app_state.dart'; // (★★★★★) AppState에서 소켓을 가져오기 위해 임포트

class DeployModal extends StatefulWidget {
  // (★★★★★ 수정 ★★★★★)
  // 부모로부터 값을 전달받지 않으므로 생성자에서 변수들을 제거합니다.
  const DeployModal({super.key});

  @override
  State<DeployModal> createState() => _DeployModalState();
}

class _DeployModalState extends State<DeployModal> {
  // (★★★★★ 수정 ★★★★★)
  // 전달받는 props 대신 내부 상태 변수로 변경
  double _progress = 0.0;
  String _currentStep = "Connecting..."; // 기본값
  final List<String> _logs = [];
  final ScrollController _scrollController = ScrollController(); // 자동 스크롤

  // (★★★★★ 신규 ★★★★★)
  // AppState에서 소켓 인스턴스를 가져옵니다.
  final IO.Socket? socket = AppState.instance.socket;

  @override
  void initState() {
    super.initState();
    // (★★★★★ 신규 ★★★★★)
    // 소켓 리스너를 등록합니다.
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    if (socket == null) {
      print("DeployModal Error: Socket is null.");
      return;
    }

    // 1. 상태 업데이트 리스너
    // (참고: server.js의 emitLog가 'status-update'를 emit합니다)
    socket!.on('status-update', _onStatusUpdate);

    // 2. 로그 리스너
    socket!.on('new-log', _onNewLog);
  }

  // (★★★★★ 신규 ★★★★★)
  // 상태 업데이트 처리
  void _onStatusUpdate(dynamic data) {
    if (!mounted) return;

    // (참고: data['status']에 "linting", "building" 등이 들어옵니다)
    // (이 값은 server.js의 runFakeSelfHealingDeploy 함수에 정의되어 있습니다)
    final String step = data['status'] ?? "Unknown";
    double newProgress = 0.0;

    switch (step) {
      case "linting":
        _currentStep = "Git Clone & Setup"; // (UI에 표시될 이름)
        newProgress = 0.1;
        break;
      case "testing":
        _currentStep = "Docker Build";
        newProgress = 0.3;
        break;
      case "building":
        _currentStep = "ECR Push";
        newProgress = 0.6;
        break;
      case "deploying":
        _currentStep = "ECS Deployment";
        newProgress = 0.8;
        break;
      case "done":
        _currentStep = "Verification";
        newProgress = 1.0;
        break;
      case "TRAFFIC_ERROR":
      case "ROLLBACK":
        _currentStep = "Rollback";
        // (롤백 애니메이션을 위해 Lottie에 'Rollback' 케이스 추가)
        break;
      default:
        _currentStep = step;
        newProgress = _progress; // 진행률 유지
    }

    setState(() {
      _progress = newProgress;
    });
  }

  // (★★★★★ 신규 ★★★★★)
  // 새 로그 처리
  void _onNewLog(dynamic data) {
    if (!mounted) return;

    // (중요) deployId가 0 (전역 로그)이 아닌, 현재 배포와 관련된 로그만 필터링
    // (참고: server.js의 'new-plant' 이벤트가 plantId를 반환해야 함)
    // (우선은 모든 로그를 받는다고 가정합니다)

    final logMessage = data['log']?['message'] ?? 'Invalid log format';

    setState(() {
      _logs.add(logMessage);
    });

    // 로그창 맨 아래로 자동 스크롤
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }


  @override
  void dispose() {
    // (★★★★★ 신규 ★★★★★)
    // 위젯이 사라질 때 리스너를 반드시 해제합니다.
    socket?.off('status-update', _onStatusUpdate);
    socket?.off('new-log', _onNewLog);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black87,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        padding: const EdgeInsets.all(16),
        width: 350,
        height: 500,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 타이틀
            const Text(
              "⚾ 배포 경기 진행 중...",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),

            // 야구 애니메이션 (내부 상태 _currentStep 사용)
            _buildAnimation(_currentStep),

            const SizedBox(height: 12),

            // 진행률 바 (내부 상태 _progress 사용)
            LinearProgressIndicator(
              value: _progress,
              minHeight: 8,
              backgroundColor: Colors.grey[800],
              valueColor: AlwaysStoppedAnimation<Color>(Colors.greenAccent),
            ),
            const SizedBox(height: 8),

            Text(
              "${(_progress * 100).toStringAsFixed(1)}% 완료",
              style: const TextStyle(color: Colors.white70),
            ),

            const SizedBox(height: 16),

            // 로그창 (내부 상태 _logs 사용)
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: ListView.builder(
                  controller: _scrollController, // (★★★★★) 자동 스크롤 연결
                  itemCount: _logs.length,
                  itemBuilder: (context, index) {
                    return Text(
                      _logs[index],
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontFamily: 'monospace', // (로그는 고정폭 글꼴 추천)
                      ),
                    );
                  },
                ),
              ),
            ),

            const SizedBox(height: 12),

            // 닫기 버튼
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _progress == 1.0 ? Colors.blueAccent : Colors.redAccent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(context),
              // (★★★★★) 진행률에 따라 버튼 텍스트 변경
              child: Text(_progress == 1.0 ? "경기 종료 (성공)" : "숨기기 (진행 중)"),
            ),
          ],
        ),
      ),
    );
  }

  /// 단계에 따라 다른 애니메이션 표시
  Widget _buildAnimation(String step) {
    switch (step) {
      case "Git Clone & Setup":
        return Lottie.asset('assets/animations/hit_single.json', height: 120);
      case "Docker Build":
        return Lottie.asset('assets/animations/hit_double.json', height: 120);
      case "ECR Push":
        return Lottie.asset('assets/animations/hit_triple.json', height: 120);
      case "ECS Deployment":
        return Lottie.asset('assets/animations/home_run.json', height: 120);
      case "Verification":
        return Lottie.asset('assets/animations/win.json', height: 120);
      case "Rollback": // (신규) 롤백 케이스
        return Lottie.asset('assets/animations/error.json', height: 120); // (에러 애니메이션 경로 예시)
      default: // "Connecting..."
        return Lottie.asset('assets/animations/pitch.json', height: 120);
    }
  }
}