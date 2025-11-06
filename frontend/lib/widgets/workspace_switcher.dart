// lib/widgets/workspace_switcher.dart

import 'package:flutter/material.dart';

class WorkspaceSwitcher extends StatelessWidget {
  final List<dynamic> workspaces;
  final String? currentWorkspaceId;
  final String currentWorkspaceName; // (★★★★★ 1. 현재 워크스페이스 이름을 받도록 추가 ★★★★★)
  final Function(String, String) onWorkspaceSelected;
  final VoidCallback onCreateWorkspace;

  const WorkspaceSwitcher({
    Key? key,
    required this.workspaces,
    this.currentWorkspaceId,
    required this.currentWorkspaceName, // (★★★★★ 2. 생성자에 추가 ★★★★★)
    required this.onWorkspaceSelected,
    required this.onCreateWorkspace,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PopupMenuButton<String>(
      tooltip: "워크스페이스 전환",

      // (★★★★★ 3. 'icon:' 대신 'child:'를 사용해 버튼 모양 커스텀 ★★★★★)
      child: Container(
        margin: const EdgeInsets.only(right: 8.0), // (프로필 버튼과의 간격)
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          // (둥근 모서리)
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8.0),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // (현재 워크스페이스 이름 표시)
            Text(
              currentWorkspaceName,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            SizedBox(width: 4),
            Icon(
              Icons.arrow_drop_down, // (드롭다운 아이콘)
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
          final ws = workspaces.firstWhere((w) => w['id'] == value);
          onWorkspaceSelected(ws['id'], ws['name']);
        }
      },
      itemBuilder: (BuildContext context) {
        final theme = Theme.of(context);
        List<PopupMenuEntry<String>> items = [];

        // 1. 워크스페이스 목록
        for (final ws in workspaces) {
          items.add(
            PopupMenuItem<String>(
              value: ws['id'],
              child: Row(
                children: [
                  Icon(
                    ws['id'] == currentWorkspaceId
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: ws['id'] == currentWorkspaceId
                        ? theme.colorScheme.primary
                        : theme.hintColor,
                  ),
                  SizedBox(width: 10),
                  Text(ws['name']),
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