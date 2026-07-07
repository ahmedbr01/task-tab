import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Users, Tag, Loader2 } from 'lucide-react';
import { taskApi } from '../../api/task.api';
import { projectApi } from '../../api/project.api';
import { toast } from 'react-toastify';

const weekDays = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'];
const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const statusColors = {
  todo: '#f59e0b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  done: '#22c55e',
  cancelled: '#ef4444'
};

const statusLabels = {
  todo: '📋 À faire',
  in_progress: '🔄 En cours',
  review: '🔍 Révision',
  done: '✅ Terminé',
  cancelled: '❌ Annulé'
};

const priorityLabels = {
  low: '🟢 Basse',
  medium: '🔵 Moyenne',
  high: '🟠 Haute',
  urgent: '🔴 Urgente'
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // ============================================
  // CHARGER LES DONNÉES
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        taskApi.getAll({ per_page: 1000 }),
        projectApi.getAll({ limit: 100 })
      ]);
      
      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================
  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDate(null);
    setSelectedTasks([]);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedTasks([]);
  };

  // ============================================
  // OBTENIR LES TÂCHES D'UN JOUR
  // ============================================
  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let dayTasks = tasks.filter(t => t.start_date === dateStr || t.due_date === dateStr);
    
    if (filter === 'mine') {
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      dayTasks = dayTasks.filter(t => t.assigned_to === userId);
    }
    
    return dayTasks;
  };

  // ============================================
  // OBTENIR LES PROJETS D'UN JOUR
  // ============================================
  const getProjectsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return projects.filter(p => p.start_date === dateStr || p.end_date === dateStr);
  };

  // ============================================
  // OUVRIRE LE MODAL DES TÂCHES
  // ============================================
  const handleDayClick = (day) => {
    const dayTasks = getTasksForDay(day);
    const dayProjects = getProjectsForDay(day);
    const allEvents = [...dayTasks, ...dayProjects.map(p => ({ ...p, isProject: true }))];
    
    if (allEvents.length === 0) {
      toast.info(`📅 Aucun événement pour le ${day} ${months[month]} ${year}`);
      return;
    }
    
    setSelectedDate(day);
    setSelectedTasks(allEvents);
    setShowTaskModal(true);
  };

  // ============================================
  // FORMATER LA DATE
  // ============================================
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ============================================
  // COMPOSANT DE CHARGEMENT
  // ============================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 text-[#1a5b3e] animate-spin" />
      </div>
    );
  }

  // ============================================
  // AFFICHAGE DES JOURS
  // ============================================
  const renderDay = (day) => {
    const dayTasks = getTasksForDay(day);
    const dayProjects = getProjectsForDay(day);
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = selectedDate === day;
    
    const hasTasks = dayTasks.length > 0;
    const hasProjects = dayProjects.length > 0;
    const taskCount = dayTasks.length;
    const projectCount = dayProjects.length;

    return (
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        className={`
          min-h-[80px] p-2 border-b border-l border-slate-100 last:border-l-0 
          hover:bg-slate-50/60 transition-colors cursor-pointer
          ${isToday ? 'bg-primary-50/50' : ''}
          ${isSelected ? 'ring-2 ring-[#1a5b3e] ring-inset' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`
            inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
            ${isToday ? 'bg-[#1a5b3e] text-white' : 'text-slate-600'}
          `}>
            {day}
          </span>
          {(hasTasks || hasProjects) && (
            <span className="text-[10px] text-slate-400 font-medium">
              {taskCount + projectCount}
            </span>
          )}
        </div>
        
        <div className="mt-1 space-y-0.5">
          {dayTasks.slice(0, 2).map((task, idx) => (
            <div 
              key={idx} 
              className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate"
              style={{
                backgroundColor: `${statusColors[task.status]}22`,
                color: statusColors[task.status],
                borderRight: `2px solid ${statusColors[task.status]}`
              }}
            >
              {task.title_ar}
            </div>
          ))}
          {dayProjects.length > 0 && dayTasks.length === 0 && (
            <div className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1a5b3e]/10 text-[#1a5b3e]">
              📁 {dayProjects[0].name_ar}
              {dayProjects.length > 1 && ` +${dayProjects.length - 1}`}
            </div>
          )}
          {(taskCount + projectCount) > 2 && (
            <div className="text-[9px] text-slate-400 px-1">
              +{(taskCount + projectCount) - 2} autres
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageShell
        active="التقويم"
        title="📅 التقويم"
        subtitle={`${months[month]} ${year}`}
        right={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'mine' ? 'bg-[#1a5b3e] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                مهامي
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-[#1a5b3e] bg-[#1a5b3e]/10 rounded-xl hover:bg-[#1a5b3e]/20 transition-colors"
            >
              اليوم
            </button>
          </div>
        }
      >
        {/* Calendrier */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button 
              onClick={() => changeMonth(-1)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-bold text-base text-slate-900">
                {months[month]} {year}
              </span>
              <span className="text-xs text-slate-400">
                {tasks.filter(t => {
                  const taskMonth = new Date(t.start_date).getMonth();
                  return taskMonth === month;
                }).length} tâches
              </span>
            </div>
            <button 
              onClick={() => changeMonth(1)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {weekDays.map((d) => (
              <div key={d} className="px-2 py-2.5 text-center text-xs font-bold text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-2 bg-slate-50/30" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
          </div>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Terminé
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              En cours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              À faire
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Révision
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a5b3e]" />
              Projet
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {tasks.filter(t => {
              const taskMonth = new Date(t.start_date).getMonth();
              return taskMonth === month;
            }).length} tâches ce mois
          </div>
        </div>

        {/* Modal des tâches du jour */}
        {showTaskModal && selectedDate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
                <h3 className="text-lg font-bold text-slate-800">
                  📅 {selectedDate} {months[month]} {year}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                {selectedTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun événement pour ce jour</p>
                  </div>
                ) : (
                  selectedTasks.map((item, index) => {
                    if (item.isProject) {
                      return (
                        <div key={`project-${index}`} className="p-3 bg-[#1a5b3e]/5 rounded-xl border border-[#1a5b3e]/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1a5b3e]">📁 {item.name_ar}</span>
                            <span className="text-xs text-slate-400">Projet</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.start_date} → {item.end_date}
                          </div>
                          <div className="mt-2">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#1a5b3e]" style={{ width: `${item.progress || 0}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400">{item.progress || 0}%</span>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div 
                        key={`task-${index}`} 
                        className="p-3 rounded-xl border"
                        style={{ borderColor: `${statusColors[item.status]}44` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${statusColors[item.status]}22`, color: statusColors[item.status] }}
                              >
                                {statusLabels[item.status]}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {priorityLabels[item.priority] || item.priority}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{item.title_ar}</p>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.start_date} → {item.due_date}
                              </span>
                              {item.assigned_to && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Assigné
                                </span>
                              )}
                            </div>
                          </div>
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusColors[item.status] }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 text-center">
                  {selectedTasks.filter(e => !e.isProject).length} tâches • {selectedTasks.filter(e => e.isProject).length} projets
                </p>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </>
  );
};

export default Calendar;