import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { projectApi } from '../../api/project.api';
import { toast } from 'react-toastify';
import { FileText, Download, BarChart3 } from 'lucide-react';

const Reporting = () => {
  const { user, isManager, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectApi.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des projets');
    }
  };

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
      } else {
        toast.error('❌ Erreur chargement du rapport');
      }
    } catch (error) {
      toast.error('❌ Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

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
      subtitle="Rapports d'avancement et statistiques"
    >
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
    </PageShell>
  );
};

export default Reporting;