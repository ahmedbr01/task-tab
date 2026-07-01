const ExcelJS = require('exceljs');

class ExcelExportService {
  // ============================================
  // EXPORTER LES PROJETS
  // ============================================
  static async exportProjects(projects) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projets');

    // Colonnes
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nom du projet', key: 'name_ar', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Début', key: 'start_date', width: 15 },
      { header: 'Fin', key: 'end_date', width: 15 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Progression', key: 'progress', width: 15 },
      { header: 'Créé par', key: 'created_by', width: 20 },
      { header: 'Créé le', key: 'created_at', width: 20 },
    ];

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Ajouter les données
    projects.forEach((project, index) => {
      const row = worksheet.addRow({
        id: project.id,
        name_ar: project.name_ar,
        description: project.description || '',
        start_date: project.start_date,
        end_date: project.end_date,
        status: this.getStatusLabel(project.status),
        progress: `${project.progress}%`,
        created_by: project.creator?.full_name || project.creator?.username || '',
        created_at: project.created_at ? new Date(project.created_at).toLocaleDateString('fr-FR') : '',
      });

      // Couleur selon le statut
      const statusColors = {
        'قيد الانتظار': 'FFFFEB3B',
        'نشط': 'FF4CAF50',
        'مكتمل': 'FF2196F3',
        'ملغى': 'FFF44336',
      };
      const color = statusColors[this.getStatusLabel(project.status)] || 'FFFFFFFF';
      row.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    });

    return workbook;
  }

  // ============================================
  // EXPORTER LES TÂCHES
  // ============================================
  static async exportTasks(tasks) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tâches');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Titre', key: 'title_ar', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Assigné à', key: 'assigned_to', width: 20 },
      { header: 'Priorité', key: 'priority', width: 15 },
      { header: 'Statut', key: 'status', width: 20 },
      { header: 'Progression', key: 'progress', width: 15 },
      { header: 'Date début', key: 'start_date', width: 15 },
      { header: 'Date échéance', key: 'due_date', width: 15 },
      { header: 'Créé le', key: 'created_at', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF9800' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    tasks.forEach((task) => {
      const row = worksheet.addRow({
        id: task.id,
        title_ar: task.title_ar,
        description: task.description || '',
        assigned_to: task.assignee?.full_name || task.assignee?.username || '',
        priority: this.getPriorityLabel(task.priority),
        status: this.getTaskStatusLabel(task.status),
        progress: `${task.progress}%`,
        start_date: task.start_date,
        due_date: task.due_date,
        created_at: task.created_at ? new Date(task.created_at).toLocaleDateString('fr-FR') : '',
      });

      // Couleur selon le statut
      const statusColors = {
        '📋 À faire': 'FFFFEB3B',
        '🔄 En cours': 'FF2196F3',
        '🔍 Révision': 'FF9C27B0',
        '✅ Terminé': 'FF4CAF50',
        '❌ Annulé': 'FFF44336',
      };
      const color = statusColors[this.getTaskStatusLabel(task.status)] || 'FFFFFFFF';
      row.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    });

    return workbook;
  }

  // ============================================
  // EXPORTER LES UTILISATEURS
  // ============================================
  static async exportUsers(users) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Utilisateurs');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nom d\'utilisateur', key: 'username', width: 20 },
      { header: 'Nom complet', key: 'full_name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'phone', width: 20 },
      { header: 'Rôle', key: 'role', width: 15 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Inscrit le', key: 'created_at', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2196F3' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        username: user.username,
        full_name: user.full_name || '',
        email: user.email,
        phone: user.phone || '',
        role: this.getRoleLabel(user.role),
        status: user.is_active ? '✅ Actif' : '❌ Inactif',
        created_at: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '',
      });
    });

    return workbook;
  }

  // ============================================
  // EXPORTER LES STATISTIQUES GLOBALES
  // ============================================
  static async exportStats(stats) {
    const workbook = new ExcelJS.Workbook();

    // Résumé global
    const summarySheet = workbook.addWorksheet('Résumé');
    summarySheet.columns = [
      { header: 'Métrique', key: 'metric', width: 30 },
      { header: 'Valeur', key: 'value', width: 20 },
    ];

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };

    summarySheet.addRow({ metric: 'Total Projets', value: stats.totalProjects || 0 });
    summarySheet.addRow({ metric: 'Projets Actifs', value: stats.activeProjects || 0 });
    summarySheet.addRow({ metric: 'Projets Terminés', value: stats.completedProjects || 0 });
    summarySheet.addRow({ metric: 'Total Tâches', value: stats.totalTasks || 0 });
    summarySheet.addRow({ metric: 'Tâches Terminées', value: stats.doneTasks || 0 });
    summarySheet.addRow({ metric: 'Tâches en Cours', value: stats.inProgressTasks || 0 });
    summarySheet.addRow({ metric: 'Total Utilisateurs', value: stats.totalUsers || 0 });
    summarySheet.addRow({ metric: 'Utilisateurs Actifs', value: stats.activeUsers || 0 });
    summarySheet.addRow({ metric: 'Total Messages', value: stats.totalMessages || 0 });
    summarySheet.addRow({ metric: 'Messages Non Lus', value: stats.unreadMessages || 0 });
    summarySheet.addRow({ metric: 'Total Documents', value: stats.totalDocuments || 0 });

    return workbook;
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  static getStatusLabel(status) {
    const labels = {
      pending: 'قيد الانتظار',
      active: 'نشط',
      completed: 'مكتمل',
      cancelled: 'ملغى',
    };
    return labels[status] || status;
  }

  static getTaskStatusLabel(status) {
    const labels = {
      todo: '📋 À faire',
      in_progress: '🔄 En cours',
      review: '🔍 Révision',
      done: '✅ Terminé',
      cancelled: '❌ Annulé',
    };
    return labels[status] || status;
  }

  static getPriorityLabel(priority) {
    const labels = {
      low: '🟢 Basse',
      medium: '🔵 Moyenne',
      high: '🟠 Haute',
      urgent: '🔴 Urgente',
    };
    return labels[priority] || priority;
  }

  static getRoleLabel(role) {
    const labels = {
      admin: '👑 Admin',
      manager: '📋 Manager',
      member: '👤 Membre',
    };
    return labels[role] || role;
  }
}

module.exports = ExcelExportService;