import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyD1Lt9s8y1O_qawBcxwLNWBjwJvE5pMVzc',
    appId: '1:22325837130:web:75dc412d726937c94015b3',
    messagingSenderId: '22325837130',
    projectId: 'gogomarketuz-b0cca',
    authDomain: 'gogomarketuz-b0cca.firebaseapp.com',
    storageBucket: 'gogomarketuz-b0cca.firebasestorage.app',
    measurementId: 'G-YDLL2Z1T5P',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAI9Qy5xc0L8oQdyCgNy2XX_vPI0FzVfDk',
    appId: '1:22325837130:android:fec86e2469421da94015b3',
    messagingSenderId: '22325837130',
    projectId: 'gogomarketuz-b0cca',
    storageBucket: 'gogomarketuz-b0cca.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDqHEDLqL45kVfSrgQVosTaqfY0eLGpC6E',
    appId: '1:22325837130:ios:db7cfef37c51b02b4015b3',
    messagingSenderId: '22325837130',
    projectId: 'gogomarketuz-b0cca',
    storageBucket: 'gogomarketuz-b0cca.firebasestorage.app',
    iosBundleId: 'uz.gogomarket.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDqHEDLqL45kVfSrgQVosTaqfY0eLGpC6E',
    appId: '1:22325837130:ios:db7cfef37c51b02b4015b3',
    messagingSenderId: '22325837130',
    projectId: 'gogomarketuz-b0cca',
    storageBucket: 'gogomarketuz-b0cca.firebasestorage.app',
    iosBundleId: 'uz.gogomarket.app',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyD1Lt9s8y1O_qawBcxwLNWBjwJvE5pMVzc',
    appId: '1:22325837130:web:75dc412d726937c94015b3',
    messagingSenderId: '22325837130',
    projectId: 'gogomarketuz-b0cca',
    authDomain: 'gogomarketuz-b0cca.firebaseapp.com',
    storageBucket: 'gogomarketuz-b0cca.firebasestorage.app',
    measurementId: 'G-YDLL2Z1T5P',
  );
}
