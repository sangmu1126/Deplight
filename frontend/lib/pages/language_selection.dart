import 'package:flutter/material.dart';
import '../app_state.dart';
import '../l10n/app_localizations.dart';

class LanguageSelectionPage extends StatefulWidget {
  @override
  _LanguageSelectionPageState createState() => _LanguageSelectionPageState();
}

class _LanguageSelectionPageState extends State<LanguageSelectionPage> {
  // 글로벌 AppState 인스턴스에 접근
  final AppState _appState = AppState.instance;

  void _setLocale(Locale newLocale) {
    _appState.locale.value = newLocale;
    Navigator.of(context).pop(); // 언어 선택 후 뒤로 가기
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = _appState.locale.value;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.settingsLanguage),
      ),
      body: ListView(
        children: [
          _buildLanguageTile(
            context: context,
            title: '한국어',
            subtitle: 'Korean',
            locale: const Locale('ko'),
            currentLocale: currentLocale,
          ),
          _buildLanguageTile(
            context: context,
            title: 'English',
            subtitle: 'English (US)',
            locale: const Locale('en'),
            currentLocale: currentLocale,
          ),
          _buildLanguageTile(
            context: context,
            title: '日本語',
            subtitle: 'Japanese',
            locale: const Locale('ja'),
            currentLocale: currentLocale,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageTile({
    required BuildContext context,
    required String title,
    required String subtitle,
    required Locale locale,
    required Locale currentLocale,
  }) {
    final bool isSelected = locale.languageCode == currentLocale.languageCode;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        title: Text(title, style: TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: isSelected
            ? Icon(Icons.check_circle, color: Theme.of(context).colorScheme.primary)
            : null,
        onTap: () => _setLocale(locale),
      ),
    );
  }
}