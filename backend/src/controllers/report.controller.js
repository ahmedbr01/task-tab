const Project = require('../models/Project');
const Action = require('../models/Action');
const Task = require('../models/Task');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Calculer l'avancement prévu
const calculateExpectedProgress = (startDate, endDate, currentDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = currentDate || new Date();
  const totalDuration = end - start;
  const elapsed = now - start;
  if (totalDuration <= 0) return 100;
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  return Math.round((elapsed / totalDuration) * 100);
};

const generateProgressReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentDate = new Date();

    // Récupérer les projets
    let projects;
    if (projectId) {
      projects = await Project.findAll({ where: { id: projectId } });
    } else {
      projects = await Project.findAll();
    }

    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun projet trouvé' });
    }

    // Construire les données
    let reportData = [];
    let totalProjects = projects.length;
    let totalExpected = 0;
    let totalActual = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const project of projects) {
      const actions = await Action.findAll({ where: { project_id: project.id } });
      let projectCompleted = 0;
      let projectTotal = 0;

      for (const action of actions) {
        const tasks = await Task.findAll({ where: { action_id: action.id } });
        tasks.forEach(t => {
          projectTotal++;
          if (t.status === 'done') projectCompleted++;
        });
      }

      const actualProgress = projectTotal > 0 ? Math.round((projectCompleted / projectTotal) * 100) : 0;
      const expectedProgress = calculateExpectedProgress(project.start_date, project.end_date, currentDate);
      const gap = actualProgress - expectedProgress;

      totalTasks += projectTotal;
      completedTasks += projectCompleted;
      totalExpected += expectedProgress;
      totalActual += actualProgress;

      reportData.push({
        id: project.id,
        name: project.name_ar || 'Projet sans nom',
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        actualProgress,
        expectedProgress,
        gap,
        tasksCount: projectTotal,
        completedTasks: projectCompleted,
        actions: actions.length,
      });
    }

    const avgExpected = totalProjects > 0 ? Math.round(totalExpected / totalProjects) : 0;
    const avgActual = totalProjects > 0 ? Math.round(totalActual / totalProjects) : 0;
    const overallGap = avgActual - avgExpected;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // ============================================
    // CRÉATION DU PDF
    // ============================================
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `rapport-${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: 'Rapport d\'avancement',
        Author: 'TASK TAB',
        Subject: 'Suivi de projets',
      },
    });

    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // ============================================
    // EN-TÊTE
    // ============================================
    // Logo / Titre
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#1a5b3e')
       .text('TASK TAB', 50, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Plateforme de pilotage des projets', 50, 80);

    // Date
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Date: ${currentDate.toLocaleDateString('fr-FR')}`, { align: 'right' });

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Heure: ${currentDate.toLocaleTimeString('fr-FR')}`, { align: 'right' });

    doc.moveDown(1.5);

    // Ligne
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .strokeColor('#1a5b3e')
       .lineWidth(1.5)
       .stroke();

    doc.moveDown(1);

    // Titre principal
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('RAPPORT D\'AVANCEMENT', { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Comparaison Réel vs Prévisionnel', { align: 'center' });

    doc.moveDown(1.5);

    // ============================================
    // RÉSUMÉ GLOBAL (6 cartes)
    // ============================================
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1a5b3e')
       .text('RÉSUMÉ GLOBAL', { align: 'left' });

    doc.moveDown(0.5);

    const stats = [
      { label: 'Projets', value: totalProjects, color: '#1a5b3e' },
      { label: 'Tâches', value: `${completedTasks}/${totalTasks}`, color: '#3b82f6' },
      { label: 'Taux d\'achèvement', value: `${completionRate}%`, color: '#22c55e' },
      { label: 'Avancement réel', value: `${avgActual}%`, color: '#22c55e' },
      { label: 'Avancement prévu', value: `${avgExpected}%`, color: '#3b82f6' },
      { label: 'Écart', value: `${overallGap >= 0 ? '+' : ''}${overallGap}%`, color: overallGap >= 0 ? '#22c55e' : '#ef4444' },
    ];

    stats.forEach((stat, index) => {
      const x = 50 + (index % 3) * 180;
      const y = 220 + Math.floor(index / 3) * 45;

      doc.rect(x, y, 160, 35)
         .fill('#f8fafc')
         .strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .stroke();

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(stat.color)
         .text(String(stat.value), x + 15, y + 5);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(stat.label, x + 15, y + 22);
    });

    doc.moveDown(3.5);

    // ============================================
    // BARRE DE PROGRESSION GLOBALE
    // ============================================
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('PROGRESSION GLOBALE', { align: 'left' });

    doc.moveDown(0.3);

    const barY = doc.y;
    const barX = 50;
    const barWidth = 500;
    const barHeight = 22;

    // Fond
    doc.rect(barX, barY, barWidth, barHeight)
       .fill('#e5e7eb');

    // Barre réelle
    doc.rect(barX, barY, (avgActual / 100) * barWidth, barHeight)
       .fill('#22c55e');

    // Barre prévue (ligne rouge)
    const expectedX = barX + (avgExpected / 100) * barWidth;
    doc.moveTo(expectedX, barY - 8)
       .lineTo(expectedX, barY + barHeight + 8)
       .strokeColor('#ef4444')
       .lineWidth(2.5)
       .stroke();

    // Labels
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(`RÉEL: ${avgActual}%`, barX + 15, barY + 5);

    doc.fillColor('#ef4444')
       .text(`PRÉVU: ${avgExpected}%`, expectedX + 10, barY - 14);

    // Pourcentage d'écart
    const gapLabel = overallGap >= 0 ? `+${overallGap}%` : `${overallGap}%`;
    const gapColor = overallGap >= 0 ? '#22c55e' : '#ef4444';
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(gapColor)
       .text(`Écart: ${gapLabel}`, { align: 'right' });

    doc.moveDown(2.5);

    // ============================================
    // DÉTAIL PAR PROJET
    // ============================================
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1a5b3e')
       .text('DÉTAIL PAR PROJET', { align: 'left' });

    doc.moveDown(0.5);

    for (const [index, project] of reportData.entries()) {
      // Vérifier l'espace
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a5b3e')
           .text('DÉTAIL PAR PROJET (suite)', { align: 'left' });
        doc.moveDown(0.5);
      }

      // Conteneur
      const boxY = doc.y;
      doc.rect(50, boxY, 500, 85)
         .fill('#ffffff')
         .strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .stroke();

      // Nom du projet
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1f2937')
         .text(project.name, 65, boxY + 10);

      // Statut
      const statusMap = {
        active: 'En cours',
        completed: 'Terminé',
        pending: 'En attente',
        cancelled: 'Annulé',
      };
      const statusColor = project.status === 'completed' ? '#22c55e' :
                          project.status === 'active' ? '#3b82f6' :
                          project.status === 'pending' ? '#f59e0b' : '#ef4444';

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(statusColor)
         .text(`Statut: ${statusMap[project.status] || project.status}`, 65, boxY + 28);

      // Tâches
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`Tâches: ${project.completedTasks}/${project.tasksCount} terminées`, 65, boxY + 43);

      // Progression
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`Avancement réel: ${project.actualProgress}%`, 65, boxY + 58);

      // Barre de progression
      const pBarX = 220;
      const pBarY = boxY + 18;
      const pBarWidth = 310;
      const pBarHeight = 12;

      doc.rect(pBarX, pBarY, pBarWidth, pBarHeight)
         .fill('#e5e7eb');

      doc.rect(pBarX, pBarY, (project.actualProgress / 100) * pBarWidth, pBarHeight)
         .fill(project.actualProgress >= project.expectedProgress ? '#22c55e' : '#f59e0b');

      const pExpectedX = pBarX + (project.expectedProgress / 100) * pBarWidth;
      doc.moveTo(pExpectedX, pBarY - 5)
         .lineTo(pExpectedX, pBarY + pBarHeight + 5)
         .strokeColor('#ef4444')
         .lineWidth(2)
         .stroke();

      // Labels sur la barre
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`${project.actualProgress}%`, pBarX + 5, pBarY + 2);

      doc.fillColor('#ef4444')
         .text(`Prévu: ${project.expectedProgress}%`, pExpectedX + 8, pBarY - 10);

      // Écart
      const gapText = project.gap >= 0 ? `✅ En avance de ${project.gap}%` : `⚠️ En retard de ${Math.abs(project.gap)}%`;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(project.gap >= 0 ? '#22c55e' : '#ef4444')
         .text(gapText, 420, boxY + 68);

      doc.moveDown(1.2);
    }

    // ============================================
    // PIED DE PAGE
    // ============================================
    doc.moveDown(1);
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .strokeColor('#e2e8f0')
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(0.5);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#9ca3af')
       .text('TASK TAB - Plateforme de pilotage des projets', { align: 'center' })
       .text('CNRPS - Bureau de la Communication et de la Coopération Internationale', { align: 'center' })
       .text(`Document généré le ${currentDate.toLocaleDateString('fr-FR')} à ${currentDate.toLocaleTimeString('fr-FR')}`, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      res.download(filepath, `rapport-avancement-${currentDate.toISOString().split('T')[0]}.pdf`, (err) => {
        if (err) console.error('❌ Erreur téléchargement:', err);
        setTimeout(() => {
          try { fs.unlinkSync(filepath); } catch (e) {}
        }, 5000);
      });
    });

    writeStream.on('error', (error) => {
      console.error('❌ Erreur écriture PDF:', error);
      res.status(500).json({ success: false, message: error.message });
    });

  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
      error: error.message,
    });
  }
};

// Exporter les données JSON
const getReportData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentDate = new Date();

    let projects;
    if (projectId) {
      projects = await Project.findAll({ where: { id: projectId } });
    } else {
      projects = await Project.findAll();
    }

    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun projet trouvé' });
    }

    let reportData = [];
    let totalProjects = projects.length;
    let totalExpected = 0;
    let totalActual = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const project of projects) {
      const actions = await Action.findAll({ where: { project_id: project.id } });
      let projectCompleted = 0;
      let projectTotal = 0;

      for (const action of actions) {
        const tasks = await Task.findAll({ where: { action_id: action.id } });
        tasks.forEach(t => {
          projectTotal++;
          if (t.status === 'done') projectCompleted++;
        });
      }

      const actualProgress = projectTotal > 0 ? Math.round((projectCompleted / projectTotal) * 100) : 0;
      const expectedProgress = calculateExpectedProgress(project.start_date, project.end_date, currentDate);
      const gap = actualProgress - expectedProgress;

      totalTasks += projectTotal;
      completedTasks += projectCompleted;
      totalExpected += expectedProgress;
      totalActual += actualProgress;

      reportData.push({
        id: project.id,
        name: project.name_ar || 'Projet sans nom',
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        actualProgress,
        expectedProgress,
        gap,
        tasksCount: projectTotal,
        completedTasks: projectCompleted,
        actions: actions.length,
      });
    }

    const avgExpected = totalProjects > 0 ? Math.round(totalExpected / totalProjects) : 0;
    const avgActual = totalProjects > 0 ? Math.round(totalActual / totalProjects) : 0;
    const overallGap = avgActual - avgExpected;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      report: {
        projects: reportData,
        summary: {
          totalProjects,
          totalTasks,
          completedTasks,
          avgExpected,
          avgActual,
          overallGap,
          completionRate,
        },
      },
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateProgressReport,
  getReportData,
};