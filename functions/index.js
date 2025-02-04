const functions = require("firebase-functions");
const admin = require('firebase-admin');
//admin.initializeApp();

const reportsController = require('./reportsController');
const ReportsPdfController = require('./pdfController');
const serviceAccount = require('./inova.json');


admin.initializeApp({
  apiKey: "AIzaSyCiuE1YMRwHCBLwNL7cnZzfhJjf-Uhxih4",
  authDomain: "motok-7d13a.firebaseapp.com",
  databaseURL: "https://motok-7d13a-default-rtdb.firebaseio.com",
  projectId: "motok-7d13a",
  storageBucket: "motok-7d13a.appspot.com",
  messagingSenderId: "586536055929",
  appId: "1:586536055929:web:c53de9532119419dfb10a8",
  measurementId: "G-TQ0182Q808"

});


  function gunnerAddUser(change, context) {
    const snapshot = change.after;
    const data = snapshot.val();
    const state = data.state;

    return admin
      .auth()
      .createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      })
      .then((userRecord) => {
        console.log('Usuário criado com sucesso:', data.name, userRecord.uid);

        const photos = [
          'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/imagens%2Flogo.png?alt=media&token=4f14d655-3163-44cb-8558-9e5f6f44c69b',
          'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/imagens%2Flogo.png?alt=media&token=4f14d655-3163-44cb-8558-9e5f6f44c69b',                
          'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/imagens%2Flogo.png?alt=media&token=4f14d655-3163-44cb-8558-9e5f6f44c69b',
          'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/imagens%2Flogo.png?alt=media&token=4f14d655-3163-44cb-8558-9e5f6f44c69b',
        ];

        return admin
          .database()
          .ref('/userProfile/' + state)
          .update({
            [userRecord.uid]: {
              uid: userRecord.uid,
              email: data.email,
              name: data.name,
              tel: data.tel,
              photos: photos,
              userType: data.userType,
              instagram: data.instagram,
              status: 'Perfil verificado',
            }
          }, (error) => {
            if (error) {
              console.log('Erro ao atualizar perfil:', error);
              throw error;
            } else {
              console.log('Perfil atualizado com sucesso:', userRecord.uid);
            }
          });
      })
      .then(() => {
        console.log('Perfil de usuário criado com sucesso:', data.name);
      })
      .catch((error) => {
        console.log('Erro ao criar usuário:', error);
        throw error;
      });
  }


  function gunnerRemoveUser(change, context){

    return new Promise( (resolve, reject) => {

      const snapshot = change.after
      let data = snapshot.val()  
      
      console.log('Dados remover usuário: ',data)
      console.log('Removendo usuário: ', data.uid)
      
      admin.auth().deleteUser(data.uid)

      .then(function() {
          console.log("Successfully deleted user " + data.uid);
          resolve()
      })
      .catch(function(error) {
        console.log("Error deleting user:" + data.uid + ' .Erro: '  + error);
        reject()
    });

    })
  }


  function gunnerNotifications(change, context) {
    const notificationIcon =
      'https://firebasestorage.googleapis.com/v0/b/nos-veja.appspot.com/o/fotos%2Ffotos%2Fprofile20220306-212702?alt=media&token=fotos/profile20220306-212702';
    const notificationSound = 'ding';

    const snapshot = change.after;
    const token = snapshot.val().token;
    let tokens = [token];

    if (snapshot.val().tokens) {
      tokens = snapshot.val().tokens;
    }

    const payload = {
      notification: {
        title: 'Nova notificação!',
        body: snapshot.val().msg,
        icon: notificationIcon,
        sound: notificationSound,
      },
      data: {
        type: '1',
        key: snapshot.key,
      },
    };

    const promises = tokens.map((token) => {
      return admin.messaging().sendToDevice(token, payload);
    });

    return Promise.all(promises)
      .then(() => {
        console.log(promises.length + ' Notificações enviadas');
      })
      .catch((error) => {
        console.log(error.message);
      });
  }


exports.gunnerAddUser = 
functions.database
.instance("gunner")
.ref('/userAdd/{state}/{msgId}')
.onWrite((change, context) => {  
  if (!change.after.exists()) {
    return new Promise(function(resolve){
      resolve()
    });
  } 
  return gunnerAddUser(change, context)  
});


exports.gunnerDelUser = 
functions.database
.instance("gunner")
.ref('/userDel/{state}/{msgId}')
.onWrite((change, context) => {  
  if (!change.after.exists()) {
    return new Promise(function(resolve){
      resolve()
    });
  } 
  return gunnerRemoveUser(change, context)  
});


exports.gunnerApiMessages = 
functions.database
.instance("gunner")
.ref('/notifications/{state}/{year}/{month}/{msgId}')
.onWrite((change, context) => {  
  if (!change.after.exists()) {
    return new Promise(function(resolve){
      resolve()
    });
  } 
  return gunnerNotifications(change, context)
});

exports.gunnerReports = 
    functions.database
    .instance("gunner")
    .ref('/reports/{state}/{year}/{month}/{relatoriosId}')
    .onWrite((snapshot, context) => {               
      return reportsController.reportsAtiradorHub(snapshot, context)      
});

exports.gunnerPdfReports = 
    functions.database
    .instance("gunner")
    .ref('/reportsPdf/{state}/{year}/{month}/{relatoriosId}')
    .onWrite((snapshot, context) => {               
      return ReportsPdfController.reportsPdfAtiradorHub(snapshot, context)      
});


