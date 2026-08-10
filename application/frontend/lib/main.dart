import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'firebase_options.dart';

import 'package:flutter_localizations/flutter_localizations.dart';
import '../l10n/app_localizations.dart';
import 'app_state.dart';
import 'theme/app_theme.dart';

import 'app_core.dart';
import 'pages/login.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // 로컬 모드: Firebase 초기화 생략
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final AppState _appState = AppState.instance;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: _appState.themeMode,
      builder: (context, themeMode, child) {
        return ValueListenableBuilder<Locale>(
          valueListenable: _appState.locale,
          builder: (context, locale, child) {
            return MaterialApp(
              debugShowCheckedModeBanner: false,
              title: 'Deplight',
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: AppLocalizations.supportedLocales,
              locale: locale,
              theme: AppTheme.lightTheme,
              darkTheme: AppTheme.darkTheme,
              themeMode: themeMode,
              home: AuthWrapper(),
            );
          },
        );
      },
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 로컬 모드: 로그인 과정을 건너뛰고 바로 메인으로 진입하거나, 
    // 스트림 대신 고정된 값을 반환합니다.
    return AppCore();
  }
}
