const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'task_tab_db'
    });

    // Hasher le mot de passe
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('📝 Mot de passe:', password);
    console.log('🔑 Hash:', hashedPassword);

    // Supprimer l'ancien admin
    await connection.execute('DELETE FROM users WHERE username = ?', ['admin']);
    console.log('✅ Ancien admin supprimé');

    // Créer le nouvel admin
    await connection.execute(
      `INSERT INTO users (username, password_hash, full_name, email, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', hashedPassword, 'مدير النظام', 'admin@cnrps.tn', 'admin', 1]
    );
    console.log('✅ Nouvel admin créé');

    // Vérifier
    const [rows] = await connection.execute('SELECT id, username, role FROM users WHERE username = ?', ['admin']);
    console.log('✅ Utilisateur créé:', rows);

    await connection.end();
    console.log('\n🎯 Identifiants de test:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('\n🔗 Test avec curl:');
    console.log('curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"Admin@123\\"}"');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createAdmin();