import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { projectApi } from '../../api/project.api';
import { toast } from 'react-toastify';

const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const Gantt = () => {
  const [scale, setScale] = useState('trimestre');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <PageShell
        active="مخطط جانت"
        title="مخطط جانت"
        subtitle="الترتيب الزمني للمشاريع والإجراءات — سنة 2026"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg text-slate-500">لا توجد مشاريع لعرضها</p>
          <p className="text-sm text-slate-400">قم بإنشاء مشروع أولاً</p>
        </div>
      </PageShell>
    );
  }

  const colors = ['#1a5b3e', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const getMonthIndex = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return date.getMonth();
  };

  const getSpan = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(diff + 1, 1);
  };

  const ganttData = projects.slice(0, 8).map((project, index) => ({
    id: project.id,
    name: project.name_ar || 'Projet sans nom',
    axis: 'Axe stratégique',
    start: getMonthIndex(project.start_date),
    span: getSpan(project.start_date, project.end_date),
    color: colors[index % colors.length],
    progress: project.progress || 0,
  }));

  return (
    <PageShell
      active="مخطط جانت"
      title="مخطط جانت"
      subtitle="الترتيب الزمني للمشاريع والإجراءات — سنة 2026"
      right={
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setScale('trimestre')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              scale === 'trimestre' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500'
            }`}
          >
            فصلي
          </button>
          <button
            onClick={() => setScale('annee')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              scale === 'annee' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500'
            }`}
          >
            سنوي
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-slate-800">السنة 2026</span>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[220px_repeat(12,1fr)] border-b border-slate-100 bg-slate-50/60">
              <div className="px-4 py-2.5 text-xs font-bold text-slate-500">المشروع</div>
              {months.map((m) => (
                <div key={m} className="px-1 py-2.5 text-[11px] font-semibold text-slate-500 text-center border-r border-slate-100 last:border-r-0">
                  {m}
                </div>
              ))}
            </div>

            {ganttData.map((project) => (
              <div key={project.id} className="grid grid-cols-[220px_repeat(12,1fr)] border-b border-slate-50 last:border-b-0 hover:bg-slate-50/40 transition-colors">
                <div className="px-4 py-3.5 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{project.name}</p>
                  <p className="text-[11px] text-slate-400">{project.axis}</p>
                </div>

                <div className="col-span-12 relative grid grid-cols-12">
                  {months.map((m, i) => (
                    <div key={m} className="border-r border-slate-50 last:border-r-0" />
                  ))}

                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-6 rounded-lg flex items-center px-2 shadow-sm"
                    style={{
                      right: `${(project.start / 12) * 100}%`,
                      width: `${(project.span / 12) * 100}%`,
                      backgroundColor: `${project.color}22`,
                      border: `1.5px solid ${project.color}`,
                    }}
                  >
                    <div
                      className="h-full rounded-md absolute top-0 right-0"
                      style={{
                        width: `${Math.min(project.progress, 100)}%`,
                        backgroundColor: project.color,
                        opacity: 0.85,
                      }}
                    />
                    <span
                      className="relative text-[10px] font-bold tabular-nums"
                      dir="ltr"
                      style={{ color: project.progress > 40 ? '#fff' : project.color }}
                    >
                      {project.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ganttData.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 px-1">
          {ganttData.slice(0, 5).map((project) => (
            <span key={project.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
              {project.axis}
            </span>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default Gantt;