import 'package:flutter/material.dart';

// 콜백 함수 (생성된 Secret 데이터를 상위 위젯으로 전달)
typedef OnSecretAdded = void Function(String name, String value, String? description);

class NewSecretDialog extends StatefulWidget {
  final OnSecretAdded onSecretAdded;

  const NewSecretDialog({
    Key? key,
    required this.onSecretAdded,
  }) : super(key: key);

  @override
  _NewSecretDialogState createState() => _NewSecretDialogState();
}

class _NewSecretDialogState extends State<NewSecretDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _valueController = TextEditingController();
  final _descController = TextEditingController();

  // --- 이미지와 100% 일치하는 색상 및 스타일 ---
  static const Color _textColor = Color(0xFF111827); // (제목, 레이블)
  static const Color _subTextColor = Color(0xFF374151); // (레이블)
  static const Color _hintColor = Color(0xFF9CA3AF); // (힌트 텍스트)
  static const Color _borderColor = Color(0xFFD1D5DB); // (테두리)
  static const Color _iconColor = Color(0xFF6B7280); // (X 아이콘)
  static const Color _primaryColor = Color(0xFF60A5FA); // (파란색 버튼)
  static const Color _dangerColor = Color(0xFFEF4444); // (빨간색 별표)

  static const Color _warningBgColor = Color(0xFFFEFCE8); // (경고창 배경)
  static const Color _warningIconColor = Color(0xFFF59E0B); // (경고창 아이콘)
  static const Color _warningTextColor = Color(0xFFCA8A04); // (경고창 텍스트)
  static const Color _warningTitleColor = Color(0xFFB45309); // (경고창 제목)

  @override
  void dispose() {
    _nameController.dispose();
    _valueController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submitForm() {
    // 폼 유효성 검사
    if (_formKey.currentState!.validate()) {
      // 콜백 실행
      widget.onSecretAdded(
        _nameController.text.trim(),
        _valueController.text.trim(),
        _descController.text.trim().isNotEmpty
            ? _descController.text.trim()
            : null,
      );
      Navigator.of(context).pop(); // 모달 닫기
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      backgroundColor: Colors.white,
      // 모든 기본 패딩 제거 (수동 제어)
      titlePadding: EdgeInsets.zero,
      contentPadding: EdgeInsets.zero,
      actionsPadding: EdgeInsets.zero,
      // 모달의 최대 너비
      content: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min, // content 크기에 맞춤
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. 헤더 (제목, 닫기 버튼)
            _buildHeader(context),
            // 2. 구분선
            const Divider(height: 1, color: _borderColor),
            // 3. 폼 영역
            _buildContent(context),
            // 4. 액션 버튼 (취소, Secret 추가)
            _buildActions(context),
          ],
        ),
      ),
    );
  }

  // --- 1. 헤더 ---
  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 16, 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "새 Secret 추가",
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: _textColor,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: _iconColor),
            onPressed: () => Navigator.of(context).pop(),
            splashRadius: 20,
          ),
        ],
      ),
    );
  }

  // --- 3. 폼 영역 ---
  Widget _buildContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- Secret 이름 ---
            _buildTextField(
              controller: _nameController,
              label: "Secret 이름",
              hint: "예: DATABASE_URL, API_SECRET_KEY",
              isRequired: true,
              validator: (val) {
                if (val == null || val.isEmpty) return "Secret 이름을 입력하세요.";
                // (보너스) Secret/Env 이름 형식 검사 (대문자, _, 숫자만)
                if (!RegExp(r'^[A-Z_][A-Z0-9_]*$').hasMatch(val)) {
                  return "대문자, 숫자, 밑줄( _ )만 사용 가능합니다.";
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            // --- Secret 값 ---
            _buildTextField(
              controller: _valueController,
              label: "Secret 값",
              hint: "Secret 값을 입력하세요",
              isRequired: true,
              maxLines: 4, // 여러 줄 입력
              validator: (val) {
                if (val == null || val.isEmpty) return "Secret 값을 입력하세요.";
                return null;
              },
            ),
            const SizedBox(height: 20),
            // --- 설명 (선택사항) ---
            _buildTextField(
              controller: _descController,
              label: "설명 (선택사항)",
              hint: "이 Secret의 용도를 설명해주세요",
              isRequired: false, // 별표 없음
            ),
            const SizedBox(height: 24),
            // --- 보안 주의사항 박스 ---
            _buildWarningBox(context),
          ],
        ),
      ),
    );
  }

  // --- 4. 액션 버튼 ---
  Widget _buildActions(BuildContext context) {
    return Padding(
      // 버튼 영역은 상단 패딩이 없음 (폼 영역의 bottom 패딩으로 대체)
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      child: Row(
        children: [
          // --- 취소 버튼 ---
          Expanded(
            child: OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: OutlinedButton.styleFrom(
                foregroundColor: _subTextColor,
                side: const BorderSide(color: _borderColor),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text("취소", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            ),
          ),
          const SizedBox(width: 12),
          // --- Secret 추가 버튼 ---
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _submitForm,
              icon: const Icon(Icons.add, size: 20),
              label: const Text("Secret 추가", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                elevation: 0, // 이미지에 그림자 없음
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- 헬퍼: 텍스트 필드 ---
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool isRequired,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            text: label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: _subTextColor),
            children: [
              if (isRequired)
                const TextSpan(text: ' *', style: TextStyle(color: _dangerColor)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: _hintColor),
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
              borderSide: const BorderSide(color: _primaryColor, width: 2),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          ),
        ),
      ],
    );
  }

  // --- 헬퍼: 보안 주의사항 박스 ---
  Widget _buildWarningBox(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _warningBgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_rounded, color: _warningIconColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "보안 주의사항",
                  style: TextStyle(fontWeight: FontWeight.bold, color: _warningTitleColor),
                ),
                const SizedBox(height: 8),
                _buildBulletPoint("Secret은 암호화되어 저장됩니다"),
                _buildBulletPoint("한 번 저장하면 값을 다시 볼 수 없습니다"),
                _buildBulletPoint("민감한 정보만 Secret으로 관리하세요"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- 헬퍼: 주의사항 불렛 포인트 ---
  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(color: _warningTextColor)),
          Expanded(child: Text(text, style: const TextStyle(color: _warningTextColor, fontSize: 13))),
        ],
      ),
    );
  }
}