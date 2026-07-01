import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { taskApi } from '../../api/task.api';
import { toast } from 'react-toastify';

const weekDays = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'];
const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const eventTypes = {
  task: { label: 'مهمة', color: '#3b82f6' },
  meeting: { label: 'اجتماع', color: '#f59e0b' },
  action: { label: 'إجراء', color: '#1a5b3e' },
  project: { label: 'مشروع', color: '#ef4444' },
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await taskApi.getAll();
      setTasks(response.data.tasks || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.start_date === dateStr || t.due_date === dateStr);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell
      active="التقويم"
      title="التقويم"
      subtitle={`${months[month]} ${year}`}
      right={
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'mine' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500'}`}
          >
            آجالي
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500'}`}
          >
            كل الآجال
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-bold text-base text-slate-900">{months[month]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {weekDays.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-xs font-bold text-slate-500">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] p-2 bg-slate-50/30" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDay(day);
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={day} className={`min-h-[100px] border-b border-l border-slate-50 last:border-l-0 p-2 hover:bg-slate-50/60 transition-colors cursor-pointer ${isToday ? 'bg-primary-50' : ''}`}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${isToday ? 'bg-[#1a5b3e] text-white' : 'text-slate-600'}`}>
                  {day}
                </span>
                <div className="mt-1.5 space-y-1">
                  {dayTasks.slice(0, 3).map((task, j) => (
                    <div key={j} className="text-[10px] font-semibold px-1.5 py-1 rounded-md truncate bg-blue-50 text-blue-600">
                      {task.title_ar}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-slate-400 px-1">+{dayTasks.length - 3} أخرى</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          {Object.values(eventTypes).map((t) => (
            <span key={t.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
        <button className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> إضافة حدث
        </button>
      </div>
    </PageShell>
  );
};

export default Calendar;