import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  // 1. 텍스트 입력을 위한 컨트롤러
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _errorMessage = '';

  // 2. 로그인 로직
  Future<void> _signIn() async {
    try {
      setState(() { _errorMessage = ''; });
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
      // 로그인 성공 시 AuthWrapper가 자동으로 MainPage로 보냄
    } on FirebaseAuthException catch (e) {
      setState(() { _errorMessage = e.message ?? '로그인 실패'; });
    }
  }

  // 3. 회원가입 로직
  Future<void> _signUp() async {
    try {
      setState(() { _errorMessage = ''; });
      // 1. Firebase Auth에 사용자 생성
      UserCredential userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      String uid = userCredential.user!.uid;

      // 2. Firestore 'users' 컬렉션에 프로필 문서 생성
      await FirebaseFirestore.instance.collection('users').doc(uid).set({
        'email': _emailController.text.trim(),
        'displayName': 'New User', // (추후 프로필 수정 기능으로 변경)
        'createdAt': FieldValue.serverTimestamp(),
      });
      // 회원가입 성공 시 AuthWrapper가 자동으로 MainPage로 보냄
    } on FirebaseAuthException catch (e) {
      setState(() { _errorMessage = e.message ?? '회원가입 실패'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Deplight 로그인')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: '이메일'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 10),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: '비밀번호'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            if (_errorMessage.isNotEmpty)
              Text(_errorMessage, style: TextStyle(color: Colors.red)),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _signIn,
              child: Text('로그인'),
            ),
            TextButton(
              onPressed: _signUp,
              child: Text('회원가입'),
            ),
          ],
        ),
      ),
    );
  }
}