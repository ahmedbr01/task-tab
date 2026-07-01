const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('========================================');
console.log('🔑 VAPID Keys générées');
console.log('========================================');
console.log('VAPID_PUBLIC_KEY:', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY:', vapidKeys.privateKey);
console.log('========================================');
console.log('Ajoutez ces clés à votre fichier .env');