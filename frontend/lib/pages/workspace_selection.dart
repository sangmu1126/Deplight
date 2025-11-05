import 'package:flutter/material.dart';
import '../widgets/profile_menu.dart';
import '../l10n/app_localizations.dart';

// --- (3) "워크스페이스 선택" 페이지 (1.png) ---
class WorkspaceSelectionPage extends StatelessWidget {
  final Function(String, String) onWorkspaceSelected;
  final List<Map<String, String>> Function() getWorkspaces; // (신규)

  const WorkspaceSelectionPage({
    Key? key,
    required this.onWorkspaceSelected,
    required this.getWorkspaces, // (신규)
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final colorScheme = theme.colorScheme;
    final l10n = AppLocalizations.of(context)!;

    final hardcodedWorkspaces = getWorkspaces(); // (신규)

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
        actions: [ProfileMenuButton()],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 600),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 32),
                Text(
                  l10n.workspaceSelectTitle,
                  style: textTheme.headlineLarge?.copyWith(
                    color: textTheme.displayLarge?.color,
                    fontWeight: FontWeight.bold,
                    height: 1.3,
                  ),
                ),
                SizedBox(height: 32),
                Expanded(
                  child: ListView.builder(
                    itemCount: hardcodedWorkspaces.length,
                    itemBuilder: (context, index) {
                      final ws = hardcodedWorkspaces[index];
                      String wsName = ws['name']!;
                      String wsId = ws['id']!;

                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                        child: Card(
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            onTap: () => onWorkspaceSelected(wsId, wsName),
                            borderRadius: BorderRadius.circular(20.0),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 24.0, vertical: 20.0),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor:
                                    colorScheme.primary.withOpacity(0.1),
                                    child: Text(ws['icon'] ?? wsName[0],
                                        style: TextStyle(
                                            color: colorScheme.primary,
                                            fontWeight: FontWeight.bold)),
                                  ),
                                  SizedBox(width: 16),
                                  Text(
                                    wsName,
                                    style: textTheme.bodyLarge
                                        ?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}