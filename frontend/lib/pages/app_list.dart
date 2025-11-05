import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../models/plant_model.dart';
import '../widgets/profile_menu.dart';
import 'dart:math';
import '../l10n/app_localizations.dart'; // (신규)

// --- (4) "장식장" 페이지 (Toss 리스트 스타일) ---
class ShelfPage extends StatelessWidget {
// ... (멤버 변수는 이전과 동일) ...
  final String workspaceId;
  final String workspaceName;
  final List<Plant> shelf;
  final VoidCallback onDeploy;
  final Function(Plant) onPlantTap;
  final Function(int, String) onSlackReaction;

  const ShelfPage(
// ... (생성자는 이전과 동일) ...
          {Key? key,
        required this.workspaceId,
        required this.workspaceName,
        required this.shelf,
        required this.onDeploy,
        required this.onPlantTap,
        required this.onSlackReaction,
      })
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final List<Plant> currentShelf = shelf;
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!; // (신규)

    return Scaffold(
      appBar: AppBar(
        title: Text(workspaceName),
        actions: [ProfileMenuButton()],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 16),
            Text(l10n.apps, // (수정)
              style: theme.textTheme.headlineLarge?.copyWith(
                color: theme.textTheme.displayLarge?.color,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),

            Expanded(
              child: currentShelf.isEmpty
                  ? Center(child: Text('앱이 없습니다. "새 앱 배포하기"를 눌러 시작하세요.'))
                  : ListView.builder(
// ... (이하 ListView.builder 로직은 이전과 동일) ...
                itemCount: currentShelf.length,
                itemBuilder: (context, index) {
                  final plant = currentShelf[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6.0),
                    child: TossProjectListTile(
                      plant: plant,
                      onTap: () => onPlantTap(plant),
                      onSlackReaction: (emoji) => onSlackReaction(plant.id, emoji),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: onDeploy,
        label: Text(l10n.deployNewApp), // (수정)
        icon: Icon(Icons.add),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        shape: StadiumBorder(),
      ),
    );
  }
}

// --- (5) "Toss 스타일 리스트 타일" ---
class TossProjectListTile extends StatelessWidget {
// ... (멤버 변수는 이전과 동일) ...
  final Plant plant;
  final VoidCallback onTap;
  final Function(String) onSlackReaction;

  const TossProjectListTile({
// ... (생성자는 이전과 동일) ...
    Key? key,
    required this.plant,
    required this.onTap,
    required this.onSlackReaction,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!; // (신규)

// ... (Lottie 파일 선택 로직은 이전과 동일) ...
    String lottieFile;
    switch (plant.plant) {
      case 'rose': lottieFile = 'assets/rose.json'; break;
      case 'cactus': lottieFile = 'assets/cactus.json'; break;
      case 'bonsai': lottieFile = 'assets/bonsai.json'; break;
      case 'sunflower': lottieFile = 'assets/sunflower.json'; break;
      case 'maple': lottieFile = 'assets/maple.json'; break;
      case 'cherry_blossom': lottieFile = 'assets/cherry_blossom.json'; break;
      case 'pot': lottieFile = 'assets/pot.json'; break;
      default: lottieFile = 'assets/pot.json';
    }
    if (plant.status == 'FAILED') lottieFile = 'assets/wilted_fly.json';
    if (plant.status == 'DEPLOYING' || plant.status == 'PENDING') lottieFile = 'assets/growing.json';

    Color statusColor;
// ... (상태 색상 로직은 이전과 동일) ...
    if (plant.status == 'FAILED') statusColor = Colors.red;
    else if (plant.status == 'DEPLOYING' || plant.status == 'PENDING') statusColor = Colors.orange;
    else statusColor = Colors.green;

    return Stack(
        children: [
          Card(
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(20.0),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
// ... (Lottie 아이콘 UI는 이전과 동일) ...
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(color: theme.scaffoldBackgroundColor, borderRadius: BorderRadius.circular(12)),
                      child: Lottie.asset(lottieFile, width: 52, height: 52, fit: BoxFit.contain),
                    ),
                    SizedBox(width: 16),
// ... (텍스트 영역 UI는 이전과 동일) ...
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(plant.version, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: statusColor),
                              SizedBox(width: 6),
                              Text(
                                  plant.status,
                                  style: theme.textTheme.bodySmall
                              ),
                              SizedBox(width: 6),
                              Text(plant.reactions.join(' '), style: TextStyle(fontSize: 14)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios, size: 16, color: theme.hintColor),
                  ],
                ),
              ),
            ),
          ),
          if (plant.isSparkling)
            IgnorePointer(
// ... (반짝임 Lottie UI는 이전과 동일) ...
              child: Center(
                child: Lottie.asset('assets/sparkles.json', width: 150, height: 150, repeat: false),
              ),
            ),
        ]
    );
  }
}