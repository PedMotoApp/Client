importScripts('https://www.gstatic.com/firebasejs/9.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.3.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.


firebase.initializeApp({
    apiKey: "AIzaSyCiuE1YMRwHCBLwNL7cnZzfhJjf-Uhxih4",
    authDomain: "motok-7d13a.firebaseapp.com",
    databaseURL: "https://motok-7d13a-default-rtdb.firebaseio.com",
    projectId: "motok-7d13a",
    storageBucket: "motok-7d13a.appspot.com",
    messagingSenderId: "586536055929",
    appId: "1:586536055929:web:c53de9532119419dfb10a8",
    measurementId: "G-TQ0182Q808"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();