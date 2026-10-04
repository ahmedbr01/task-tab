import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { projectApi } from '../../api/project.api';
import { taskApi } from '../../api/task.api';
import { toast } from 'react-toastify';
import {
  LayoutGrid,
  FolderKanban,
  Kanban,
  GanttChartSquare,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  MoreHorizontal,
  Users,
  FileText,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Utilisation de l'API configurée avec les chemins relatifs
        const [statsRes, tasksRes, projectsRes] = await Promise.all([dashboardApi.getStats(), taskApi.getStats(), projectApi.getAll({ limit: 20 })]);

        const statsData = statsRes.data;
        const tasksData = tasksRes.data;
        const projectsData = projectsRes.data;

        setData({
          stats: statsData?.stats || statsData || {},
          tasks: tasksData?.stats || tasksData || {},
          projects: projectsData?.projects || projectsData || []
        });
        setError(null);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
        <p className="mt-4 text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <PageShell active="لوحة القيادة" title="لوحة القيادة" subtitle="Vue d'ensemble">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="text-red-600 w-12 h-12 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </PageShell>
    );
  }

  const stats = data?.stats || {};
  const tasks = data?.tasks || {};
  const projects = data?.projects || [];

  const totalProjects = stats.totalProjects || 0;
  const totalTasks = stats.totalTasks || 0;
  const completedTasks = stats.completedTasks || 0;
  const inProgressTasks = stats.inProgressTasks || 0;
  const overdueTasks = stats.overdueTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: 'Terminées', value: tasks.done || 0, color: '#22c55e' },
    { name: 'En cours', value: tasks.inProgress || 0, color: '#3b82f6' },
    { name: 'À faire', value: tasks.todo || 0, color: '#f59e0b' },
    { name: 'En retard', value: overdueTasks || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const kpis = [
    { label: "المشاريع النشطة", value: totalProjects, delta: `${totalProjects} هذا الشهر`, deltaPositive: true, icon: FolderKanban, accent: "#1a5b3e" },
    { label: "إجمالي المهام", value: totalTasks, delta: `${totalTasks} totale`, deltaPositive: true, icon: ListTodo, accent: "#3b82f6" },
    { label: "مهام منجزة", value: completedTasks, delta: `${completionRate}% من المجموع`, deltaPositive: completionRate >= 50, icon: CheckCircle2, accent: "#22c55e" },
    { label: "مهام جارية", value: inProgressTasks, delta: "نسق طبيعي", deltaPositive: true, icon: Clock, accent: "#f59e0b" },
    { label: "مهام متأخرة", value: overdueTasks, delta: overdueTasks > 0 ? "تتطلب المتابعة" : "جميع المهام في الموعد", deltaPositive: overdueTasks === 0, icon: AlertTriangle, accent: "#ef4444" },
  ];

  const recentProjects = projects.slice(0, 5);

  return (
    <PageShell
      active="لوحة القيادة"
      title="لوحة القيادة"
      subtitle="نظرة عامة على أداء مكتب الاتصال والتعاون الدولي"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 pr-6 overflow-hidden hover:shadow-md transition-shadow"
            >
              <span
                className="absolute top-0 right-0 h-full w-1.5 rounded-s-2xl"
                style={{ backgroundColor: kpi.accent }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${kpi.accent}1A` }}
              >
                <Icon className="w-5 h-5" style={{ color: kpi.accent }} />
              </div>
              <p className="mt-4 text-sm text-slate-500">{kpi.label}</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums" dir="ltr">
                {kpi.value}
              </p>
              <p className={`text-xs mt-2 font-medium ${kpi.deltaPositive ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                {kpi.delta}
              </p>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-1">توزيع المهام حسب الحالة</h3>
          <p className="text-xs text-slate-400 mb-3">إجمالي المهام النشطة لهذه الفترة</p>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={56} paddingAngle={3} stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, direction: "rtl" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-slate-900" dir="ltr">{totalTasks}</span>
                <span className="text-[10px] text-slate-400">المجموع</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 min-w-0">
              {statusData.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-semibold text-slate-800 shrink-0 tabular-nums" dir="ltr">
                    {d.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-1">حالة المشاريع</h3>
          <p className="text-xs text-slate-400 mb-3">توزيع المشاريع حسب الحالة</p>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'نشط', value: projects.filter(p => p.status === 'active').length, color: '#22c55e' },
                      { name: 'مكتمل', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' },
                      { name: 'قيد الانتظار', value: projects.filter(p => p.status === 'pending').length, color: '#f59e0b' },
                      { name: 'ملغى', value: projects.filter(p => p.status === 'cancelled').length, color: '#ef4444' },
                    ].filter(d => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {[
                      { name: 'نشط', value: projects.filter(p => p.status === 'active').length, color: '#22c55e' },
                      { name: 'مكتمل', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' },
                      { name: 'قيد الانتظار', value: projects.filter(p => p.status === 'pending').length, color: '#f59e0b' },
                      { name: 'ملغى', value: projects.filter(p => p.status === 'cancelled').length, color: '#ef4444' },
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, direction: "rtl" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-slate-900" dir="ltr">{totalProjects}</span>
                <span className="text-[10px] text-slate-400">المجموع</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 min-w-0">
              {[
                { name: 'نشط', value: projects.filter(p => p.status === 'active').length, color: '#22c55e' },
                { name: 'مكتمل', value: projects.filter(p => p.status === 'completed').length, color: '#3b82f6' },
                { name: 'قيد الانتظار', value: projects.filter(p => p.status === 'pending').length, color: '#f59e0b' },
                { name: 'ملغى', value: projects.filter(p => p.status === 'cancelled').length, color: '#ef4444' },
              ].filter(d => d.value > 0).map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 min-w-0 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-semibold text-slate-800 shrink-0 tabular-nums" dir="ltr">
                    {d.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Projets récents */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">آخر المشاريع</h3>
            <p className="text-xs text-slate-400 mt-0.5">المشاريع المضافة حديثًا</p>
          </div>
          <button className="text-xs font-semibold text-[#1a5b3e] hover:underline shrink-0">عرض الكل</button>
        </div>
        {recentProjects.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recentProjects.map((project) => (
              <li key={project.id} className="py-3 flex items-center gap-4">
                <span
                  className="w-1.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: project.progress >= 80 ? '#22c55e' : project.progress >= 50 ? '#f59e0b' : '#3b82f6' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{project.name_ar}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {project.description || 'بدون وصف'} · {project.progress || 0}%
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    project.status === 'completed' ? 'bg-green-100 text-green-600' :
                    project.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {project.status === 'active' ? '🔄 جارية' :
                     project.status === 'completed' ? '✅ منجزة' :
                     project.status === 'pending' ? '⏳ قيد الانتظار' : '❌ ملغاة'}
                  </span>
                  <span className="text-[11px] text-slate-400">{project.start_date} → {project.end_date}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-400 py-8">لا توجد مشاريع حالياً</p>
        )}
      </div>
    </PageShell>
  );
};

export default Dashboard;