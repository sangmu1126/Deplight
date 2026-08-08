import 'package:flutter/material.dart';

// 콜백 (이름, 설명, 선택된 타입 전달)
typedef OnWorkspaceCreated = void Function(String name, String description, String type);

class NewWorkspaceDialog extends StatefulWidget {
  final OnWorkspaceCreated onWorkspaceCreated;

  const NewWorkspaceDialog({
    Key? key,
    required this.onWorkspaceCreated,
  }) : super(key: key);

  @override
  _NewWorkspaceDialogState createState() => _NewWorkspaceDialogState();
}

class _NewWorkspaceDialogState extends State<NewWorkspaceDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();

  // '개발'/'운영' 토글 상태 관리를 위한 변수
  String _selectedType = 'development'; // 'development' or 'operations'

  // --- 이미지와 100% 일치하는 색상 및 스타일 ---
  static const Color _textColor = Color(0xFF111827); // (제목, 레이블)
  static const Color _subTextColor = Color(0xFF374151); // (레이블, 본문)
  static const Color _hintColor = Color(0xFF9CA3AF); // (힌트 텍스트)
  static const Color _borderColor = Color(0xFFD1D5DB); // (테두리)
  static const Color _iconColor = Color(0xFF6B7280); // (X 아이콘)
  static const Color _dangerColor = Color(0xFFEF4444); // (빨간색 별표)

  static const Color _primaryBlue = Color(0xFF3B82F6); // (선택된 테두리, 아이콘)
  static const Color _primaryBlueBg = Color(0xFFEFF6FF); // (선택된 배경, 정보창 배경)
  static const Color _primaryBlueButton = Color(0xFF60A5FA); // (생성하기 버튼)

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submitForm() {
    // 폼 유효성 검사
    if (_formKey.currentState!.validate()) {
      // 콜백 실행
      widget.onWorkspaceCreated(
        _nameController.text.trim(),
        _descController.text.trim(),
        _selectedType, // 'development' or 'operations'
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
        constraints: const BoxConstraints(maxWidth: 500),
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
            // 4. 액션 버튼 (취소, 생성하기)
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
          Row(
            children: [
              // (신규) 헤더 아이콘
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _primaryBlueBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.corporate_fare_outlined, color: _primaryBlue, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                "새 워크스페이스 생성",
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: _textColor,
                ),
              ),
            ],
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
      // (수정) 버튼 영역에 패딩이 없으므로, content에서 bottom 패딩 추가
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- 워크스페이스 이름 ---
            _buildTextField(
              controller: _nameController,
              label: "워크스페이스 이름",
              hint: "예: New WorkSpace",
              isRequired: true,
              validator: (val) {
                if (val == null || val.isEmpty) return "워크스페이스 이름을 입력하세요.";
                return null;
              },
            ),
            const SizedBox(height: 20),
            // --- 설명 ---
            _buildTextField(
              controller: _descController,
              label: "설명",
              hint: "워크스페이스에 대한 간단한 설명을 입력하세요",
              isRequired: false,
              maxLines: 3, // 여러 줄
            ),
            const SizedBox(height: 20),
            // --- 워크스페이스 유형 ---
            const Text(
              "워크스페이스 유형",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: _subTextColor),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTypeToggle(
                    label: "개발",
                    icon: Icons.code_outlined,
                    type: 'development',
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTypeToggle(
                    // (참고) 이미지의 'A' 아이콘 대신 의미가 맞는 로켓 아이콘 사용
                    label: "운영",
                    icon: Icons.rocket_launch_outlined,
                    type: 'operations',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // --- 정보 박스 ---
            _buildInfoBox(context),
          ],
        ),
      ),
    );
  }

  // --- 4. 액션 버튼 ---
  Widget _buildActions(BuildContext context) {
    // (수정) 버튼 영역을 구분선으로 분리하고 패딩 적용
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: _borderColor)),
      ),
      padding: const EdgeInsets.all(16),
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
          // --- 생성하기 버튼 ---
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _submitForm,
              icon: const Icon(Icons.add, size: 20),
              label: const Text("생성하기", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryBlueButton,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                elevation: 0,
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
              borderSide: const BorderSide(color: _primaryBlue, width: 2),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          ),
        ),
      ],
    );
  }

  // --- 헬퍼: '개발'/'운영' 토글 버튼 ---
  Widget _buildTypeToggle({
    required String label,
    required IconData icon,
    required String type,
  }) {
    final bool isSelected = (_selectedType == type);

    return InkWell(
      onTap: () {
        setState(() {
          _selectedType = type;
        });
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? _primaryBlueBg : Colors.white,
          border: Border.all(
            color: isSelected ? _primaryBlue : _borderColor,
            width: isSelected ? 2.0 : 1.0,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? _primaryBlue : _subTextColor,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: isSelected ? _primaryBlue : _subTextColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- 헬퍼: 정보 박스 ---
  Widget _buildInfoBox(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _primaryBlueBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: _primaryBlue, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "워크스페이스 생성 후:",
                  style: TextStyle(fontWeight: FontWeight.bold, color: _primaryBlue),
                ),
                const SizedBox(height: 8),
                _buildBulletPoint("팀 멤버를 초대할 수 있습니다"),
                _buildBulletPoint("앱 배포 및 관리가 가능합니다"),
                _buildBulletPoint("워크스페이스별 권한이 적용됩니다"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- 헬퍼: 정보 박스 불렛 포인트 ---
  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(color: _subTextColor)),
          Expanded(child: Text(text, style: const TextStyle(color: _subTextColor, fontSize: 13))),
        ],
      ),
    );
  }
}