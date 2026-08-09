const firebaseConfig = {
  apiKey: "AIzaSyDZGvxDR9vxjLLQrSfgYk-21So_u6-X9bo",
  authDomain: "nexora-exchange.firebaseapp.com",
  databaseURL: "https://nexora-exchange-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "nexora-exchange",
  storageBucket: "nexora-exchange.firebasestorage.app",
  messagingSenderId: "882282389755",
  appId: "1:882282389755:web:29e3a24be1c917ee12d05e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
