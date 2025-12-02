// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDevH6qrNPhiQjNJll59WuNApQcrcklEV4",
    authDomain: "casaviva-4ad76.firebaseapp.com",
    projectId: "casaviva-4ad76",
    storageBucket: "casaviva-4ad76.firebasestorage.app",
    messagingSenderId: "965606925542",
    appId: "1:965606925542:web:c9b2176c1de42b7b600727",
    measurementId: "G-Q86EQYXL5D"
};

// Inicializar Firebase (versión compat para HTML simple)
let db;

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase conectado exitosamente");
} else {
    console.error("Error: Firebase SDK no cargado");
}
