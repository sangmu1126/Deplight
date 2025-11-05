import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:lottie/lottie.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'dart:math';

import '../models/plant_model.dart';
import '../models/logEntry_model.dart';
import '../widgets/profile_menu.dart';
import '../l10n/app_localizations.dart';

// --- (6) "배포 상세" 페이지 (작업대) ---
class DeploymentPage extends StatefulWidget {
  final Plant plant;
  final IO.Socket socket;
  final Map<String, double> initialMetrics;
  final List<FlSpot> initialCpuData;
  final List<FlSpot> initialMemData;
  final List<LogEntry> globalLogs;

  const DeploymentPage(
      {Key? key,
        required this.plant,
        required this.socket,
        required this.initialMetrics,
        required this.initialCpuData,
        required this.initialMemData,
        required this.globalLogs})
      : super(key: key);

  @override
  _DeploymentPageState createState() => _DeploymentPageState();
}

class _DeploymentPageState extends State<DeploymentPage>
    with TickerProviderStateMixin {
  late Plant plant;
  late TabController _tabController;
  final player = AudioPlayer(); // (신규) 효과음 플레이어는 여기서 관리

  @override
  void initState() {
    super.initState();
    plant = widget.plant;
    _tabController = TabController(length: 5, vsync: this);

    // (신규) 이 페이지는 "전체적인" 상태(완료, 실패)만 수신
    widget.socket.on('status-update', _onStatusUpdate);
    widget.socket.on('plant-complete', _onPlantComplete);
  }

  @override
  void dispose() {
    _tabController.dispose();
    player.dispose(); // (신규)
    widget.socket.off('status-update', _onStatusUpdate);
    widget.socket.off('plant-complete', _onPlantComplete);
    super.dispose();
  }

  // (신규) AppBar의 "토스 스타일" 메시지만 업데이트
  void _onStatusUpdate(dynamic data) {
    if (!mounted || data['id'] != plant.id) return;
    setState(() {
      plant.currentStatusMessage = data['message'];
      plant.status = data['status']; // 롤백 버튼 표시를 위해 status도 업데이트
    });
  }

  // (신규) 배포 완료/롤백 완료 시 "식물" 모양 최종 업데이트 및 효과음
  void _onPlantComplete(dynamic data) {
    if (!mounted || data['id'] != plant.id) return;
    setState(() {
      plant.status = data['status'];
      plant.plant = data['plant'];
      plant.version = data['version'];
    });
    player.play(AssetSource('success.mp3'));
  }

  // (신규) 롤백 시작 함수
  void _startRollback() {
    // 롤백 확인 다이얼로그
    final l10n = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.rollbackConfirmTitle),
        content: Text(l10n.rollbackConfirmMessage),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.cancel)),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              widget.socket.emit('start-rollback', {'id': plant.id});
              _tabController.animateTo(0); // 콘솔 탭으로 이동
            },
            child: Text(l10n.rollbackAction, style: TextStyle(color: Colors.red[700])),
          ),
        ],
      ),
    );
  }

  // (신규) 환경변수 저장 및 재배포 함수
  void _saveAndRedeploy() {
    // (이전 _buildEnvArea의 로직을 여기로 이동)
    widget.socket.emit('start-deploy', {
      'version': '${plant.version} (Env Update)',
      'description': '환경 변수 업데이트'
    });
    _tabController.animateTo(0); // 콘솔 탭으로 이동
  }


  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    // (신규) AppBar 상태 바 색상 로직
    Color statusBarColor;
    Color statusTextColor;
    if (plant.status == 'FAILED') {
      statusBarColor = Colors.red[50]!;
      statusTextColor = Colors.red[800]!;
    } else {
      statusBarColor = Colors.green[50]!;
      statusTextColor = Colors.green[800]!;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${l10n.workbenchTitle} ${plant.version}'),
        actions: [ProfileMenuButton()],
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(40.0),
          child: Container(
            padding: EdgeInsets.all(8.0),
            color: statusBarColor,
            alignment: Alignment.center,
            child: Text(
              plant.currentStatusMessage, // 실시간 상태 메시지
              style: TextStyle(
                  color: statusTextColor, fontWeight: FontWeight.w500),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // --- (신규) 1. 메인 상단: 독립적인 애니메이션 위젯 ---
          Container(
            color: theme.cardColor,
            padding: EdgeInsets.all(10),
            height: 150,
            child: _MainAnimationView(
              socket: widget.socket,
              plantId: plant.id,
              initialStatus: plant.status, // 초기 상태
              initialPlant: plant.plant, // 초기 식물
            ),
          ),
          // --- (신규) 2. 하단 5-Tab ---
          Expanded(
            child: DefaultTabController(
              length: 5,
              child: Column(
                children: [
                  Container(
                    decoration: BoxDecoration(
                        color: theme.scaffoldBackgroundColor,
                        border: Border(
                            bottom: BorderSide(
                                color: theme.dividerColor, width: 1))),
                    child: TabBar(
                      controller: _tabController,
                      indicatorColor: theme.colorScheme.primary,
                      labelColor: theme.colorScheme.primary,
                      unselectedLabelColor: theme.hintColor,
                      isScrollable: true,
                      tabs: [
                        Tab(icon: Icon(Icons.terminal), text: l10n.tabConsole),
                        Tab(icon: Icon(Icons.bar_chart), text: l10n.tabVitals),
                        Tab(icon: Icon(Icons.support_agent), text: l10n.tabAIGardener),
                        Tab(icon: Icon(Icons.public), text: l10n.tabGlobalTraffic),
                        Tab(icon: Icon(Icons.vpn_key), text: l10n.tabEnvironment),
                      ],
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        // --- (신규) 3. 각 탭을 독립적인 위젯으로 분리 ---
                        _ConsoleArea(
                          socket: widget.socket,
                          plantId: plant.id,
                          initialLogs: plant.logs, // 초기 로그
                        ),
                        _MetricsArea(
                          socket: widget.socket,
                          initialCpuData: widget.initialCpuData,
                          initialMemData: widget.initialMemData,
                        ),
                        _StatusArea(
                          socket: widget.socket,
                          plant: plant, // 롤백 버튼을 위해 plant 객체 전달
                          initialMetrics: widget.initialMetrics,
                          initialAiInsight: plant.aiInsight,
                          onRollback: _startRollback, // (신규) 롤백 함수 전달
                        ),
                        _GlobalTrafficArea(
                          globalLogs: widget.globalLogs, // 글로벌 로그 전달
                        ),
                        _EnvArea(
                          onSave: _saveAndRedeploy, // (신규) 저장 함수 전달
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- (신규) 1. 메인 애니메이션 위젯 ---
class _MainAnimationView extends StatefulWidget {
  final IO.Socket socket;
  final int plantId;
  final String initialStatus;
  final String initialPlant;

  const _MainAnimationView({
    required this.socket,
    required this.plantId,
    required this.initialStatus,
    required this.initialPlant,
  });

  @override
  _MainAnimationViewState createState() => _MainAnimationViewState();
}

class _MainAnimationViewState extends State<_MainAnimationView> {
  String deployStep = '';
  String plantLottie = '';

  @override
  void initState() {
    super.initState();
    deployStep = widget.initialStatus;
    plantLottie = widget.initialPlant;

    // 이 위젯은 'status-update'와 'plant-complete'만 구독
    widget.socket.on('status-update', _onStatusUpdate);
    widget.socket.on('plant-complete', _onPlantComplete);
  }

  @override
  void dispose() {
    widget.socket.off('status-update', _onStatusUpdate);
    widget.socket.off('plant-complete', _onPlantComplete);
    super.dispose();
  }

  void _onStatusUpdate(dynamic data) {
    if (!mounted || data['id'] != widget.plantId) return;
    setState(() {
      deployStep = data['status'] ?? '';
    });
  }

  void _onPlantComplete(dynamic data) {
    if (!mounted || data['id'] != widget.plantId) return;
    setState(() {
      deployStep = data['status'];
      plantLottie = data['plant'];
    });
  }

  @override
  Widget build(BuildContext context) {
    String lottieFile;
    switch (deployStep) {
      case 'linting': case 'ROLLBACK': lottieFile = 'assets/seed.json'; break;
      case 'testing': lottieFile = 'assets/sprout.json'; break;
      case 'building': case 'deploying': case 'routing': case 'CLEANUP':
      lottieFile = 'assets/growing.json'; break;
      case 'done': case 'HEALTHY':
    // 완료 상태면 저장된 식물 모양 (bonsai, rose 등)
      lottieFile = 'assets/${plantLottie}.json';
      break;
      case 'failed': case 'FAILED':
      lottieFile = 'assets/wilted_fly.json'; break;
      default:
        lottieFile = 'assets/pot.json';
    }

    // (신규) Lottie 파일이 존재하지 않을 경우를 대비한 Fallback
    // (실제 앱에서는 assets 폴더 확인 로직이 필요함)
    if (lottieFile == 'assets/null.json') lottieFile = 'assets/pot.json';

    return Lottie.asset(lottieFile, width: 250, height: 250);
  }
}

// --- (신규) 2. 콘솔 탭 위젯 ---
class _ConsoleArea extends StatefulWidget {
  final IO.Socket socket;
  final int plantId;
  final List<LogEntry> initialLogs;

  const _ConsoleArea({
    required this.socket,
    required this.plantId,
    required this.initialLogs,
  });

  @override
  _ConsoleAreaState createState() => _ConsoleAreaState();
}

class _ConsoleAreaState extends State<_ConsoleArea> {
  List<LogEntry> logs = [];
  final ScrollController _logScrollController = ScrollController();
  final TextEditingController _consoleController = TextEditingController();

  @override
  void initState() {
    super.initState();
    logs = List.from(widget.initialLogs); // 초기 로그로 설정
    widget.socket.on('new-log', _onNewLog);
  }

  @override
  void dispose() {
    widget.socket.off('new-log', _onNewLog);
    _logScrollController.dispose();
    _consoleController.dispose();
    super.dispose();
  }

  void _onNewLog(dynamic data) {
    if (!mounted) return;

    final log = LogEntry(
        time: DateTime.parse(data['log']['time']),
        message: data['log']['message'],
        status: data['log']['status']
    );

    // 이 식물의 로그(plant.id) 또는 글로벌 콘솔 로그(id: 0)만 받음
    if (data['id'] == widget.plantId || (data['id'] == 0 && (log.status.startsWith('CONSOLE') || log.status == 'COMMAND'))) {
      setState(() {
        logs.add(log);
      });
      _scrollToBottom(_logScrollController);
    }
  }

  void _scrollToBottom(ScrollController controller) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (controller.hasClients) { controller.animateTo(controller.position.maxScrollExtent, duration: Duration(milliseconds: 100), curve: Curves.easeOut); }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    // (이하 UI 로직은 이전 _buildConsoleArea와 동일)
    return Container( color: theme.colorScheme.surface, child: Column( children: [
      Expanded( child: Padding( padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
        child: ListView.builder(
          controller: _logScrollController,
          itemCount: logs.length,
          itemBuilder: (context, index) {
            final log = logs[index];
            Color logColor; String prefix = '[${log.status}]'; String message = log.message;
            switch(log.status) {
              case 'COMMAND': logColor = theme.textTheme.bodyMedium!.color!; prefix = '\$'; message = ' ${log.message}'; break;
              case 'CONSOLE': logColor = theme.textTheme.bodyMedium!.color!.withOpacity(0.8); prefix = ''; break;
              case 'CONSOLE_ERROR': logColor = Colors.red[700]!; prefix = ''; break;
              case 'FAILED': logColor = Colors.red[700]!; prefix = '[${log.status}] ${DateFormat('HH:mm:ss').format(log.time.toLocal())}:'; break;
              case 'DONE': logColor = Colors.blue[800]!; prefix = '[${log.status}] ${DateFormat('HH:mm:ss').format(log.time.toLocal())}:'; break;
              case 'SYSTEM': logColor = theme.hintColor; prefix = '[SYSTEM]'; break;
              case 'TRAFFIC_HIT': logColor = Colors.lightBlue[300]!; prefix = '[TRAFFIC]'; break;
              case 'AI_INSIGHT': logColor = Colors.purple[700]!; prefix = '[AI]'; break;
              case 'ROLLBACK': logColor = Colors.orange[800]!; prefix = '[${log.status}] ${DateFormat('HH:mm:ss').format(log.time.toLocal())}:'; break;
              default: logColor = Colors.green[800]!; prefix = '[${log.status}] ${DateFormat('HH:mm:ss').format(log.time.toLocal())}:';
            }
            return Text('$prefix $message', style: TextStyle(color: logColor, fontFamily: 'monospace', fontSize: 13));
          },
        ),
      )),
      Container(
          padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          color: theme.scaffoldBackgroundColor,
          child: Row( children: [
            Text('>', style: TextStyle(color: Colors.green[800], fontFamily: 'monospace', fontSize: 14)), SizedBox(width: 8),
            Expanded( child: TextField(
              controller: _consoleController, style: TextStyle(color: theme.textTheme.bodyMedium!.color, fontFamily: 'monospace', fontSize: 14),
              decoration: InputDecoration(
                  hintText: l10n.consoleHint,
                  hintStyle: TextStyle(color: theme.hintColor, fontFamily: 'monospace'),
                  border: InputBorder.none, isDense: true
              ),
              onSubmitted: (command) {
                if (command.isEmpty) return;
                if (command.toLowerCase() == 'clear') { setState(() => logs = []); }
                else widget.socket.emit('run-command', command);
                _consoleController.clear();
              },
            )),
          ])),
    ]));
  }
}

// --- (신규) 3. 매트릭스 탭 위젯 ---
class _MetricsArea extends StatefulWidget {
  final IO.Socket socket;
  final List<FlSpot> initialCpuData;
  final List<FlSpot> initialMemData;

  const _MetricsArea({
    required this.socket,
    required this.initialCpuData,
    required this.initialMemData,
  });

  @override
  _MetricsAreaState createState() => _MetricsAreaState();
}

class _MetricsAreaState extends State<_MetricsArea> {
  List<FlSpot> cpuData = [];
  List<FlSpot> memData = [];
  double _timeCounter = 1.0;

  @override
  void initState() {
    super.initState();
    cpuData = List.from(widget.initialCpuData);
    memData = List.from(widget.initialMemData);
    _timeCounter = (cpuData.lastOrNull?.x ?? 0.0) + 1.0;

    // 이 위젯은 'metrics-update'만 구독
    widget.socket.on('metrics-update', _onMetricsUpdate);
  }

  @override
  void dispose() {
    widget.socket.off('metrics-update', _onMetricsUpdate);
    super.dispose();
  }

  void _onMetricsUpdate(dynamic data) {
    if (!mounted) return;
    setState(() {
      double cpu = data['cpu'].toDouble();
      double mem = data['mem'].toDouble();
      cpuData.add(FlSpot(_timeCounter, cpu));
      memData.add(FlSpot(_timeCounter, mem));
      if (cpuData.length > 20) cpuData.removeAt(0);
      if (memData.length > 20) memData.removeAt(0);
      _timeCounter += 1.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    // (이하 UI 로직은 이전 _buildMetricsArea와 동일)
    return Container(
        color: theme.scaffoldBackgroundColor,
        padding: EdgeInsets.all(16.0),
        child: SingleChildScrollView( child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.vitalsTitle, style: theme.textTheme.titleLarge),
            SizedBox(height: 20),
            Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.vitalsCPU, style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.bold)),
                      SizedBox(height: 16),
                      Container(height: 150, child: _buildLineChart(cpuData, Colors.blue)),
                    ],
                  ),
                )
            ),
            SizedBox(height: 16),
            Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.vitalsMemory, style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.bold)),
                      SizedBox(height: 16),
                      Container(height: 150, child: _buildLineChart(memData, Colors.green)),
                    ],
                  ),
                )
            ),
          ],
        )));
  }

  LineChart _buildLineChart(List<FlSpot> data, Color color) {
    final theme = Theme.of(context);
    return LineChart( LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: true, getDrawingHorizontalLine: (v) => FlLine(color: theme.dividerColor, strokeWidth: 0.5)),
      titlesData: FlTitlesData(show: false),
      borderData: FlBorderData(show: false),
      lineBarsData: [ LineChartBarData(
        spots: data, isCurved: true, color: color, barWidth: 3,
        dotData: FlDotData(show: false), belowBarData: BarAreaData(show: true, color: color.withOpacity(0.2)),
      )],
    ));
  }
}

// --- (신규) 4. 상태 탭 위젯 ---
class _StatusArea extends StatefulWidget {
  final IO.Socket socket;
  final Plant plant; // 롤백을 위해 'plant' 객체 필요
  final Map<String, double> initialMetrics;
  final String initialAiInsight;
  final VoidCallback onRollback; // 롤백 함수

  const _StatusArea({
    required this.socket,
    required this.plant,
    required this.initialMetrics,
    required this.initialAiInsight,
    required this.onRollback,
  });

  @override
  _StatusAreaState createState() => _StatusAreaState();
}

class _StatusAreaState extends State<_StatusArea> {
  String aiInsight = '';
  String deployStep = '';
  Map<String, double> currentMetrics = {};

  @override
  void initState() {
    super.initState();
    aiInsight = widget.initialAiInsight;
    deployStep = widget.plant.status;
    currentMetrics = widget.initialMetrics;

    // 이 위젯은 'ai-insight', 'status-update', 'metrics-update'를 구독
    widget.socket.on('ai-insight', _onAiInsight);
    widget.socket.on('status-update', _onStatusUpdate);
    widget.socket.on('metrics-update', _onMetricsUpdate);
  }

  @override
  void dispose() {
    widget.socket.off('ai-insight', _onAiInsight);
    widget.socket.off('status-update', _onStatusUpdate);
    widget.socket.off('metrics-update', _onMetricsUpdate);
    super.dispose();
  }

  void _onAiInsight(dynamic data) {
    if (!mounted || data['id'] != widget.plant.id) return;
    setState(() => aiInsight = data['message']);
  }

  void _onStatusUpdate(dynamic data) {
    if (!mounted || data['id'] != widget.plant.id) return;
    setState(() => deployStep = data['status']);
  }

  void _onMetricsUpdate(dynamic data) {
    if (!mounted) return;
    setState(() => currentMetrics = { 'cpu': data['cpu'].toDouble(), 'mem': data['mem'].toDouble() });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    String statusText; Color statusColor;
    bool isDeploying = deployStep.isNotEmpty && deployStep != 'waiting' && deployStep != 'done' && deployStep != 'FAILED' && deployStep != 'HEALTHY';
    bool isHealthy = deployStep == 'HEALTHY' || deployStep == 'done';

    if (isDeploying) { statusText = 'Growing'; statusColor = Colors.orange[700]!; }
    else if (deployStep == 'FAILED') { statusText = 'Wilted'; statusColor = Colors.red[700]!; }
    else { statusText = 'Healthy'; statusColor = Colors.green[700]!; }

    return Container(
        color: theme.scaffoldBackgroundColor,
        padding: EdgeInsets.all(20.0),
        child: SingleChildScrollView(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("${l10n.statusTitle} (${widget.plant.version})", style: theme.textTheme.titleLarge),
                    SizedBox(height: 20), Row( children: [
                      Icon(Icons.circle, color: statusColor, size: 14), SizedBox(width: 8),
                      Text(statusText, style: TextStyle(fontSize: 16, color: statusColor, fontWeight: FontWeight.bold)),
                    ]),
                    if (isHealthy && !isDeploying)
                      Padding(
                        padding: const EdgeInsets.only(top: 16.0),
                        child: TextButton.icon(
                          icon: Icon(Icons.history, color: Colors.red[700]),
                          label: Text(l10n.rollbackNow, style: TextStyle(color: Colors.red[700])),
                          style: TextButton.styleFrom( side: BorderSide(color: Colors.red[200]!) ),
                          onPressed: widget.onRollback, // (신규) 부모의 함수 호출
                        ),
                      ),
                    SizedBox(height: 20), Divider(color: theme.dividerColor),
                    SizedBox(height: 20), Text(l10n.statusResources, style: theme.textTheme.titleMedium),
                    SizedBox(height: 16),
                    Text('CPU: ${currentMetrics['cpu']!.toStringAsFixed(1)} %', style: TextStyle(fontFamily: 'monospace', fontSize: 14, color: Colors.blue[700])),
                    SizedBox(height: 8),
                    Text('MEM: ${currentMetrics['mem']!.toStringAsFixed(1)} MB', style: TextStyle(fontFamily: 'monospace', fontSize: 14, color: Colors.green[700])),
                  ],
                ),
              ),
            ),
            SizedBox(height: 20),
            Text(l10n.statusAITitle, style: theme.textTheme.titleLarge?.copyWith(color: Colors.purple[700])),
            SizedBox(height: 10),
            Container(
              padding: EdgeInsets.all(16), width: double.infinity,
              decoration: BoxDecoration(color: Colors.purple[50], borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.purple[200]!)),
              child: Text(aiInsight, style: TextStyle(fontSize: 14, color: Colors.purple[900], height: 1.5)),
            ),
          ],
        )));
  }
}

// --- (신규) 5. 글로벌 트래픽 탭 위젯 ---
class _GlobalTrafficArea extends StatefulWidget {
  final List<LogEntry> globalLogs; // AppCore에서 글로벌 로그 리스트를 받음
  const _GlobalTrafficArea({required this.globalLogs});

  @override
  _GlobalTrafficAreaState createState() => _GlobalTrafficAreaState();
}

class _GlobalTrafficAreaState extends State<_GlobalTrafficArea> {
  final ScrollController _trafficScrollController = ScrollController();

  @override
  void dispose() {
    _trafficScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    // (신규) 글로벌 로그(widget.globalLogs)에서 트래픽만 필터링
    // (이 위젯은 독립적이므로, build 시점에 필터링)
    final trafficLogs = widget.globalLogs.where((log) => log.status == 'TRAFFIC_HIT').toList();

    // (자동 스크롤)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_trafficScrollController.hasClients) { _trafficScrollController.animateTo(_trafficScrollController.position.maxScrollExtent, duration: Duration(milliseconds: 100), curve: Curves.easeOut); }
    });

    return Container(
      color: theme.scaffoldBackgroundColor,
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
                color: theme.cardColor,
                border: Border(bottom: BorderSide(color: theme.dividerColor, width: 1))
            ),
            padding: EdgeInsets.all(16),
            child: Row(children: [
              Icon(Icons.public, color: theme.colorScheme.primary, size: 30),
              SizedBox(width: 16),
              Text(l10n.trafficTitle, style: theme.textTheme.titleLarge),
            ]),
          ),
          Expanded(
            child: ListView.builder(
              controller: _trafficScrollController,
              padding: EdgeInsets.all(16),
              itemCount: trafficLogs.length,
              itemBuilder: (context, index) {
                // (수정) 최신 로그가 아래에 오도록 정순
                final log = trafficLogs[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                  child: Text(
                    '[${DateFormat('HH:mm:ss').format(log.time.toLocal())}] ${log.message}',
                    style: TextStyle(color: theme.textTheme.bodySmall?.color, fontFamily: 'monospace', fontSize: 13),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// --- (신규) 6. 환경 변수 탭 위젯 ---
class _EnvArea extends StatelessWidget {
  final VoidCallback onSave; // 저장 및 재배포 함수
  const _EnvArea({required this.onSave});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final envVars = {
      'API_KEY': '********** (숨김)', 'DB_HOST': 'prod.rds.aws.com', 'DB_USER': 'postgres',
      'DB_PASS': '********** (숨김)', 'ENABLE_FEATURE_X': 'true',
    };

    return Container(
      color: theme.scaffoldBackgroundColor,
      padding: EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l10n.envTitle, style: theme.textTheme.titleLarge),
          SizedBox(height: 10),
          Text(l10n.envSubtitle, style: theme.textTheme.bodySmall),
          SizedBox(height: 16),
          Expanded(
            child: Card(
              color: theme.cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8.0),
                side: BorderSide(color: theme.dividerColor, width: 1),
              ),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: envVars.length,
                itemBuilder: (context, index) {
                  final key = envVars.keys.elementAt(index);
                  final value = envVars.values.elementAt(index);
                  return ListTile(
                    title: Text(key, style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                    subtitle: Text(value, style: TextStyle(fontFamily: 'monospace', color: Colors.green[800])),
                    trailing: Icon(Icons.copy, size: 18, color: theme.hintColor),
                  );
                },
              ),
            ),
          ),
          SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: Icon(Icons.save),
              label: Text(l10n.envSaveAndRedeploy),
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: theme.colorScheme.onPrimary,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: onSave, // (신규) 부모의 함수 호출
            ),
          )
        ],
      ),
    );
  }
}