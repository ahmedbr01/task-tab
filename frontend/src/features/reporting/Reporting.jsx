import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { projectApi } from '../../api/project.api';
import { axeApi } from '../../api/axe.api';
import { toast } from 'react-toastify';
import { FileText, Download, BarChart3, Wallet, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

const Reporting = () => {
  const { user, isManager, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [axes, setAxes] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [budgetReport, setBudgetReport] = useState(null);

  useEffect(() => {
    loadProjects();
    loadAxes();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des projets');
    }
  };

  const loadAxes = async () => {
    try {
      const response = await axeApi.getAll();
      setAxes(response.data.axes || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des axes');
    }
  };

  // ============================================
  // ANALYSE DU BUDGET
  // ============================================
  const analyzeBudget = () => {
    const budgetData = axes.map(axe => {
      const totalBudget = parseFloat(axe.budget_total || 0);
      const usedBudget = parseFloat(axe.budget_used || 0);
      const remaining = totalBudget - usedBudget;
      const usagePercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;
      const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;
      
      // Déterminer le statut
      let status = 'healthy';
      let statusLabel = '✅ Sain';
      let statusColor = 'text-green-600';
      let statusBg = 'bg-green-100';
      
      if (totalBudget === 0) {
        status = 'no_budget';
        statusLabel = '📭 Pas de budget';
        statusColor = 'text-gray-600';
        statusBg = 'bg-gray-100';
      } else if (remaining <= 0) {
        status = 'exhausted';
        statusLabel = '🚨 Épuisé';
        statusColor = 'text-red-600';
        statusBg = 'bg-red-100';
      } else if (remainingPercentage <= 10) {
        status = 'critical';
        statusLabel = '🔴 Critique';
        statusColor = 'text-red-600';
        statusBg = 'bg-red-100';
      } else if (remainingPercentage <= 20) {
        status = 'warning';
        statusLabel = '🟡 Attention';
        statusColor = 'text-yellow-600';
        statusBg = 'bg-yellow-100';
      }
      
      return {
        id: axe.id,
        name: axe.name_ar,
        code: axe.code || '',
        total: totalBudget,
        used: usedBudget,
        remaining: remaining,
        usagePercentage: usagePercentage,
        remainingPercentage: remainingPercentage,
        currency: axe.budget_currency || 'TND',
        status: status,
        statusLabel: statusLabel,
        statusColor: statusColor,
        statusBg: statusBg,
        projectsCount: axe.projects?.length || 0,
      };
    });

    // Filtrer les axes avec budget
    const axesWithBudget = budgetData.filter(a => a.total > 0);
    const axesWithoutBudget = budgetData.filter(a => a.total === 0);
    
    // Statistiques globales
    const totalBudget = axesWithBudget.reduce((sum, a) => sum + a.total, 0);
    const totalUsed = axesWithBudget.reduce((sum, a) => sum + a.used, 0);
    const totalRemaining = axesWithBudget.reduce((sum, a) => sum + a.remaining, 0);
    const overallUsage = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
    
    // Alertes
    const criticalAxes = axesWithBudget.filter(a => a.status === 'critical' || a.status === 'exhausted');
    const warningAxes = axesWithBudget.filter(a => a.status === 'warning');

    setBudgetReport({
      axes: budgetData,
      axesWithBudget: axesWithBudget,
      axesWithoutBudget: axesWithoutBudget,
      summary: {
        totalBudget: totalBudget,
        totalUsed: totalUsed,
        totalRemaining: totalRemaining,
        overallUsage: overallUsage,
        totalAxes: axes.length,
        axesWithBudgetCount: axesWithBudget.length,
        criticalCount: criticalAxes.length,
        warningCount: warningAxes.length,
      },
      alerts: {
        critical: criticalAxes,
        warning: warningAxes,
      }
    });
  };

  // ============================================
  // CHARGER LES DONNÉES DU RAPPORT
  // ============================================
  const loadReportData = async () => {
    setLoading(true);
    try {
      const url = selectedProject 
        ? `http://localhost:5000/api/reports/data/${selectedProject}`
        : 'http://localhost:5000/api/reports/data';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.success) {
        setReportData(data.report);
        // Analyser le budget après avoir chargé les données
        analyzeBudget();
      } else {
        toast.error('❌ Erreur chargement du rapport');
      }
    } catch (error) {
      toast.error('❌ Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GÉNÉRER LE RAPPORT PDF
  // ============================================
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const url = selectedProject 
        ? `http://localhost:5000/api/reports/progress/${selectedProject}`
        : 'http://localhost:5000/api/reports/progress';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `rapport-avancement-${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
      toast.success('✅ Rapport généré');
    } catch (error) {
      toast.error('❌ Erreur génération');
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // RENDU DES STATISTIQUES BUDGET
  // ============================================
  const renderBudgetStats = () => {
    if (!budgetReport) return null;

    const { summary, alerts, axesWithBudget } = budgetReport;

    return (
      <div className="space-y-6">
        {/* En-tête du rapport budget */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">💰 Rapport du Budget</h3>
          <span className="text-sm text-gray-500">
            {summary.axesWithBudgetCount} axes avec budget sur {summary.totalAxes}
          </span>
        </div>

        {/* Cartes récapitulatives */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget total</p>
                <p className="text-xl font-bold text-gray-900" dir="ltr">
                  {summary.totalBudget.toFixed(2)} TND
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget utilisé</p>
                <p className="text-xl font-bold text-blue-600" dir="ltr">
                  {summary.totalUsed.toFixed(2)} TND
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget restant</p>
                <p className="text-xl font-bold text-purple-600" dir="ltr">
                  {summary.totalRemaining.toFixed(2)} TND
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${summary.overallUsage > 80 ? 'bg-red-100' : summary.overallUsage > 60 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <BarChart3 className={`w-5 h-5 ${summary.overallUsage > 80 ? 'text-red-600' : summary.overallUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Taux d'utilisation</p>
                <p className={`text-xl font-bold ${summary.overallUsage > 80 ? 'text-red-600' : summary.overallUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`} dir="ltr">
                  {summary.overallUsage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {(alerts.critical.length > 0 || alerts.warning.length > 0) && (
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-4 py-3">
              <h4 className="font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes Budget ({alerts.critical.length + alerts.warning.length})
              </h4>
            </div>
            <div className="p-4 space-y-2">
              {alerts.critical.map(axe => (
                <div key={axe.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <span className="font-medium text-red-800">{axe.name}</span>
                    <span className="text-xs text-red-600 block">
                      {axe.status === 'exhausted' ? '🚨 Budget épuisé' : '🔴 Budget critique'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600" dir="ltr">
                      {axe.remaining.toFixed(2)} {axe.currency}
                    </span>
                    <span className="text-xs text-red-500 block">
                      {axe.remainingPercentage.toFixed(1)}% restant
                    </span>
                  </div>
                </div>
              ))}
              {alerts.warning.map(axe => (
                <div key={axe.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <span className="font-medium text-yellow-800">{axe.name}</span>
                    <span className="text-xs text-yellow-600 block">🟡 Budget faible</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-yellow-600" dir="ltr">
                      {axe.remaining.toFixed(2)} {axe.currency}
                    </span>
                    <span className="text-xs text-yellow-500 block">
                      {axe.remainingPercentage.toFixed(1)}% restant
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tableau détaillé par axe */}
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3">
            <h4 className="font-bold text-gray-700">📊 Détail par Axe</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Axe</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Budget total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Utilisé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Restant</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Progression</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {axesWithBudget.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Aucun budget défini pour les axes
                    </td>
                  </tr>
                ) : (
                  axesWithBudget.map(axe => (
                    <tr key={axe.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {axe.name}
                        {axe.code && <span className="text-xs text-gray-400 block">{axe.code}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600" dir="ltr">
                        {axe.total.toFixed(2)} {axe.currency}
                      </td>
                      <td className="px-4 py-3 text-blue-600" dir="ltr">
                        {axe.used.toFixed(2)} {axe.currency}
                      </td>
                      <td className={`px-4 py-3 font-bold ${axe.remaining <= 0 ? 'text-red-600' : axe.remainingPercentage <= 10 ? 'text-red-500' : axe.remainingPercentage <= 20 ? 'text-yellow-600' : 'text-green-600'}`} dir="ltr">
                        {axe.remaining.toFixed(2)} {axe.currency}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                axe.usagePercentage > 90 ? 'bg-red-500' : 
                                axe.usagePercentage > 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(axe.usagePercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600" dir="ltr">
                            {axe.usagePercentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${axe.statusBg} ${axe.statusColor}`}>
                          {axe.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Axes sans budget */}
        {budgetReport.axesWithoutBudget.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-700">
              ⚠️ {budgetReport.axesWithoutBudget.length} axe(s) n'ont pas de budget défini :
              {budgetReport.axesWithoutBudget.map(a => a.name).join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isManager && !isAdmin) {
    return (
      <PageShell active="التقارير" title="التقارير" subtitle="Accès réservé">
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">⛔ Accès réservé aux responsables</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      active="التقارير"
      title="📑 التقارير"
      subtitle="Rapports d'avancement, statistiques et suivi budgétaire"
    >
      {/* Sélecteur de projet */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm mb-2 text-right">اختر مشروع (اختياري)</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name_ar}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? '⏳ Chargement...' : '📊 Analyser'}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex-1 bg-[#1a5b3e] text-white px-4 py-2 rounded-lg hover:bg-[#0f3d28] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {generating ? '⏳ Génération...' : '📄 PDF'}
          </button>
        </div>
      </div>

      {/* Rapport d'avancement */}
      {reportData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-right">📊 Résumé global</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{reportData.summary.totalProjects}</div>
              <div className="text-sm text-gray-500">Projets</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalTasks}</div>
              <div className="text-sm text-gray-500">Tâches</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{reportData.summary.completionRate}%</div>
              <div className="text-sm text-gray-500">Taux d'achèvement</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${reportData.summary.overallGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.summary.overallGap >= 0 ? '+' : ''}{reportData.summary.overallGap}%
              </div>
              <div className="text-sm text-gray-500">Écart réel/prévu</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-gray-700 mb-3 text-right">📁 Détail par projet</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Projet</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tâches</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Réel</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Prévu</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Écart</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{project.name}</td>
                      <td className="px-4 py-3 text-gray-600">{project.completedTasks}/{project.tasksCount}</td>
                      <td className={`px-4 py-3 font-bold ${project.actualProgress >= project.expectedProgress ? 'text-green-600' : 'text-yellow-600'}`}>
                        {project.actualProgress}%
                      </td>
                      <td className="px-4 py-3 text-blue-600">{project.expectedProgress}%</td>
                      <td className={`px-4 py-3 font-bold ${project.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {project.gap >= 0 ? '+' : ''}{project.gap}%
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {project.status === 'active' ? '🔄 Actif' :
                           project.status === 'completed' ? '✅ Terminé' :
                           project.status === 'pending' ? '⏳ En attente' : '❌ Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 RAPPORT BUDGET */}
      {budgetReport && renderBudgetStats()}
    </PageShell>
  );
};

export default Reporting;