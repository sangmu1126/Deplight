// lib/widgets/workspace_switcher.dart

import 'package:flutter/material.dart';
import '../models/workspace.dart'; // (★★★★★ 1. Workspace 모델 임포트 ★★★★★)

class WorkspaceSwitcher extends StatelessWidget {
  // (★★★★★ 2. List<dynamic> -> List<Workspace>로 변경 ★★★★★)
  final List<Workspace> workspaces;
  final String? currentWorkspaceId;
  final String currentWorkspaceName;
  final Function(String, String) onWorkspaceSelected;
  final VoidCallback onCreateWorkspace;

  const WorkspaceSwitcher({
    Key? key,
    required this.workspaces,
    this.currentWorkspaceId,
    required this.currentWorkspaceName,
    required this.onWorkspaceSelected,
    required this.onCreateWorkspace,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PopupMenuButton<String>(
      tooltip: "워크스페이스 전환",

      // (버튼 모양 커스텀 - 기존과 동일)
      child: Container(
        margin: const EdgeInsets.only(right: 8.0),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8.0),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              currentWorkspaceName,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            SizedBox(width: 4),
            Icon(
              Icons.arrow_drop_down,
              color: theme.colorScheme.primary,
              size: 20,
            ),
          ],
        ),
      ),

      onSelected: (String value) {
        if (value == '__CREATE_NEW__') {
          onCreateWorkspace();
        } else {
          // (★★★★★ 3. w['id'] -> w.id 로 변경 ★★★★★)
          final ws = workspaces.firstWhere((w) => w.id == value);
          // (★★★★★ 4. ws['id'] -> ws.id, ws['name'] -> ws.name 으로 변경 ★★★★★)
          onWorkspaceSelected(ws.id, ws.name);
        }
      },
      itemBuilder: (BuildContext context) {
        final theme = Theme.of(context);
        List<PopupMenuEntry<String>> items = [];

        // 1. 워크스페이스 목록
        for (final ws in workspaces) { // (ws는 이제 Workspace 객체)
          items.add(
            PopupMenuItem<String>(
              // (★★★★★ 5. ws['id'] -> ws.id 로 변경 ★★★★★)
              value: ws.id,
              child: Row(
                children: [
                  Icon(
                    // (★★★★★ 6. ws['id'] -> ws.id 로 변경 ★★★★★)
                    ws.id == currentWorkspaceId
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: ws.id == currentWorkspaceId
                        ? theme.colorScheme.primary
                        : theme.hintColor,
                  ),
                  SizedBox(width: 10),
                  // (★★★★★ 7. ws['name'] -> ws.name 으로 변경 ★★★★★)
                  Text(ws.name),
                ],
              ),
            ),
          );
        }

        // 2. 구분선
        items.add(PopupMenuDivider());

        // 3. 새 워크스페이스 생성 버튼
        items.add(
          PopupMenuItem<String>(
            value: '__CREATE_NEW__',
            child: Row(
              children: [
                Icon(Icons.add, color: theme.textTheme.bodyMedium?.color),
                SizedBox(width: 10),
                Text("새 워크스페이스 생성"),
              ],
            ),
          ),
        );

        return items;
      },
    );
  }
}