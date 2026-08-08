import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

typedef OnDeploymentStart = void Function(
    String appName, String gitUrl, String? description
    );

class NewDeploymentDialog extends StatefulWidget {
  final OnDeploymentStart onDeploymentStart;

  const NewDeploymentDialog({
    Key? key,
    required this.onDeploymentStart,
  }) : super(key: key);

  @override
  _NewDeploymentDialogState createState() => _NewDeploymentDialogState();
}

class _NewDeploymentDialogState extends State<NewDeploymentDialog> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _appNameController = TextEditingController();
  final TextEditingController _gitUrlController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void dispose() {
    _appNameController.dispose();
    _gitUrlController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    // (수정) 이미지와 유사한 색상 팔레트 정의
    // Material 3의 기본 ColorScheme 대신 이미지에 맞춰 커스텀
    final Color primaryColor = Color(0xFF678EF2); // 배포 시작 버튼 색상
    final Color onPrimaryColor = Colors.white; // 배포 시작 버튼 텍스트 색상
    final Color surfaceColor = Color(0xFFF0F2F5); // 모달 배경색
    final Color onSurfaceColor = Color(0xFF212121); // 모달 텍스트 색상
    final Color outlineColor = Color(0xFFD3D4D6); // 취소 버튼 테두리, 텍스트필드 테두리

    return AlertDialog(
      backgroundColor: surfaceColor, // (수정) 모달 배경색
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      titlePadding: EdgeInsets.zero,
      // (수정) 전체적인 content padding을 조금 더 키워서 여백 증가
      contentPadding: const EdgeInsets.only(left: 28, right: 28, top: 12, bottom: 0),
      // (수정) actions padding도 약간 조정
      actionsPadding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      title: Stack(
        alignment: Alignment.center,
        children: [
          Padding(
            // (수정) title의 vertical padding 증가
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              l10n.deployNewApp,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 22, // (수정) 제목 폰트 크기 약간 증가
                color: onSurfaceColor, // (수정) 제목 색상
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: 8,
            child: IconButton(
              icon: Icon(Icons.close, color: onSurfaceColor.withOpacity(0.6)), // (수정) X 아이콘 색상
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ],
      ),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "앱 이름",
              style: TextStyle(
                fontSize: 16, // (수정) 레이블 폰트 크기
                color: onSurfaceColor, // (수정) 레이블 색상
                fontWeight: FontWeight.w500, // (수정) 폰트 굵기
              ),
            ),
            const SizedBox(height: 6), // (수정) 간격 조정
            TextFormField(
              controller: _appNameController,
              decoration: InputDecoration(
                hintText: "예: Frontend App",
                hintStyle: TextStyle(color: onSurfaceColor.withOpacity(0.4)), // (수정) 힌트 색상
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: outlineColor), // (수정) 테두리 색상
                ),
                enabledBorder: OutlineInputBorder( // (수정) 활성화 시 테두리 색상
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: outlineColor),
                ),
                focusedBorder: OutlineInputBorder( // (수정) 포커스 시 테두리 색상
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: primaryColor, width: 1.5), // 포커스 시 강조
                ),
                // (수정) content padding을 더 키워서 텍스트필드 내부 여백 증가
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              style: TextStyle(color: onSurfaceColor, fontSize: 16), // (수정) 입력 텍스트 색상 및 크기
              validator: (value) {
                return null;
              },
            ),
            const SizedBox(height: 24), // (수정) 간격 조정
            Text(
              "Git 리포지토리 URL",
              style: TextStyle(
                fontSize: 16, // (수정) 레이블 폰트 크기
                color: onSurfaceColor, // (수정) 레이블 색상
                fontWeight: FontWeight.w500, // (수정) 폰트 굵기
              ),
            ),
            const SizedBox(height: 6), // (수정) 간격 조정
            TextFormField(
              controller: _gitUrlController,
              decoration: InputDecoration(
                hintText: "https://github.com/username/repository",
                hintStyle: TextStyle(color: onSurfaceColor.withOpacity(0.4)), // (수정) 힌트 색상
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: outlineColor), // (수정) 테두리 색상
                ),
                enabledBorder: OutlineInputBorder( // (수정) 활성화 시 테두리 색상
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: outlineColor),
                ),
                focusedBorder: OutlineInputBorder( // (수정) 포커스 시 테두리 색상
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: primaryColor, width: 1.5),
                ),
                // (수정) content padding을 더 키워서 텍스트필드 내부 여백 증가
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              style: TextStyle(color: onSurfaceColor, fontSize: 16), // (수정) 입력 텍스트 색상 및 크기
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Git 리포지토리 URL을 입력해주세요.";
                }
                if (!value.startsWith('https://') && !value.startsWith('http://')) {
                  return "유효한 Git URL을 입력해주세요.";
                }
                return null;
              },
            ),
            const SizedBox(height: 20), // (수정) 버튼 위 여백
          ],
        ),
      ),
      actions: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: onSurfaceColor, // (수정) 텍스트 색상
                  side: BorderSide(color: outlineColor, width: 1.5), // (수정) 테두리 색상 및 두께
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  // (수정) 버튼 패딩 증가
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  l10n.cancel,
                  style: TextStyle(fontSize: 17), // (수정) 폰트 크기 증가
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    Navigator.of(context).pop();
                    widget.onDeploymentStart(
                      _appNameController.text.trim(),
                      _gitUrlController.text.trim(),
                      _descriptionController.text.trim().isNotEmpty ? _descriptionController.text.trim() : null,
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor, // (수정) 버튼 배경색
                  foregroundColor: onPrimaryColor, // (수정) 버튼 텍스트 색상
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  // (수정) 버튼 패딩 증가
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  "배포 시작",
                  style: TextStyle(fontSize: 17), // (수정) 폰트 크기 증가
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}