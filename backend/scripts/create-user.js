// backend/scripts/create-user.js
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const User = require('../src/models/User');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');

    // Supprimer l'ancien admin
    await User.destroy({ where: { username: 'admin' } });

    // Créer un nouvel admin
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    
    const admin = await User.create({
      username: 'admin',
      password_hash: passwordHash,
      full_name: 'مدير النظام',
      email: 'admin@cnrps.tn',
      role: 'admin',
      is_active: true,
    });

    console.log('✅ Admin créé avec succès');
    console.log('📝 Identifiants: admin / Admin@123');
    console.log('🔑 Hash:', passwordHash);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();