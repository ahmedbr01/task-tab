const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET ;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;
    const loginField = username || email;

    console.log('📨 Tentative de connexion:', { loginField });

    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Nom d\'utilisateur et mot de passe requis',
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: loginField },
          { email: loginField }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects',
      });
    }


    let isPasswordValid = false;
    
    if (typeof user.comparePassword === 'function') {
      isPasswordValid = await user.comparePassword(password);
    } 
    // Méthode 2: Vérifier le champ password_hash
    else if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    }
    // Méthode 3: Vérifier le champ password
    else if (user.password) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
    // Méthode 4: Vérifier les deux champs
    else {
      // Essayer de trouver le mot de passe dans n'importe quel champ
      const passwordFields = ['password_hash', 'password', 'hashedPassword', 'pass'];
      for (const field of passwordFields) {
        if (user[field]) {
          try {
            isPasswordValid = await bcrypt.compare(password, user[field]);
            if (isPasswordValid) break;
          } catch (e) {}
        }
      }
    }

    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide pour:', loginField);
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects',
      });
    }

    // Mettre à jour la dernière connexion
    user.last_login_at = new Date();
    await user.save();

    const token = generateToken(user);
    const userData = user.toJSON ? user.toJSON() : user.get({ plain: true });
    delete userData.password_hash;
    delete userData.password;

    console.log('✅ Connexion réussie pour:', user.username);

    res.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const userData = user.toJSON ? user.toJSON() : user.get({ plain: true });
    delete userData.password_hash;
    delete userData.password;
    
    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, email } = req.body;
    const user = req.user;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: user.id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé',
        });
      }
    }

    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username: req.body.username,
          id: { [Op.ne]: user.id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà utilisé',
        });
      }
    }

    const updateData = {
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      email: email || user.email,
    };

    if (req.body.username) {
      updateData.username = req.body.username;
    }

    await user.update(updateData);
    await user.reload();

    const userData = user.toJSON ? user.toJSON() : user.get({ plain: true });
    delete userData.password_hash;
    delete userData.password;

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userData,
    });
  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    let isPasswordValid = false;
    
    if (typeof user.comparePassword === 'function') {
      isPasswordValid = await user.comparePassword(currentPassword);
    } else if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    } else if (user.password) {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    }

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    if (user.password_hash !== undefined) {
      user.password_hash = hashedPassword;
    } else {
      user.password = hashedPassword;
    }
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier sélectionné',
      });
    }

    const avatarPath = `/uploads/avatars/${file.filename}`;
    
    await user.update({ avatar: avatarPath });
    await user.reload();

    const userData = user.toJSON ? user.toJSON() : user.get({ plain: true });
    delete userData.password_hash;
    delete userData.password;

    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      user: userData,
    });
  } catch (error) {
    console.error('❌ Erreur uploadAvatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement de la photo',
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
};