import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { Plus, Calendar, X } from 'lucide-react';
import { taskApi } from '../../api/task.api';
import { actionApi } from '../../api/action.api';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Kanban = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [actions, setActions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [formData, setFormData] = useState({
    action_id: '',
    title_ar: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    start_date: '',
    due_date: '',
  });

  const columns = [
    { id: 'todo', title: '📋 À faire', color: '#f59e0b' },
    { id: 'in_progress', title: '🔄 En cours', color: '#3b82f6' },
    { id: 'review', title: '🔍 Révision', color: '#8b5cf6' },
    { id: 'done', title: '✅ Terminé', color: '#22c55e' },
  ];

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 🔥 Récupérer TOUTES les tâches avec per_page=1000
      const tasksRes = await taskApi.getAll({ per_page: 1000 });
      console.log('📋 Tâches reçues:', tasksRes.data.tasks);
      console.log('📊 Nombre total de tâches:', tasksRes.data.tasks?.length);
      
      // Si l'API retourne une structure avec 'data' ou 'tasks'
      let tasksData = [];
      if (tasksRes.data.tasks) {
        tasksData = tasksRes.data.tasks;
      } else if (tasksRes.data.data) {
        tasksData = tasksRes.data.data;
      } else if (Array.isArray(tasksRes.data)) {
        tasksData = tasksRes.data;
      } else {
        tasksData = [];
      }
      
      console.log('✅ Tâches extraites:', tasksData.length);
      setTasks(tasksData);
      
      // 🔥 Forcer l'affichage de TOUTES les tâches
      setSelectedActionId(null);
      
      // Récupérer les actions
      const actionsRes = await actionApi.getAll();
      const actionsData = actionsRes.data.actions || [];
      setActions(actionsData);
      
      // Charger les utilisateurs
      try {
        const usersRes = await userApi.getAll();
        const filteredUsers = usersRes.data.users || [];
        const currentUserExists = filteredUsers.some(u => u.id === user.id);
        if (!currentUserExists) {
          filteredUsers.unshift({ 
            id: user.id, 
            username: user.username, 
            full_name: user.full_name || user.username,
            is_active: true 
          });
        }
        setUsers(filteredUsers);
      } catch (userError) {
        console.warn('⚠️ Impossible de charger les utilisateurs:', userError);
        setUsers([{ 
          id: user.id, 
          username: user.username, 
          full_name: user.full_name || user.username,
          is_active: true 
        }]);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les tâches par action sélectionnée et par statut
  const getTasksByStatus = (status) => {
    let filteredTasks = tasks;
    
    // Si une action est sélectionnée, filtrer par action_id
    if (selectedActionId) {
      filteredTasks = filteredTasks.filter(task => task.action_id === selectedActionId);
    }
    // Sinon, garder TOUTES les tâches
    
    // Filtrer par statut
    return filteredTasks.filter(task => task.status === status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.action_id || !formData.title_ar || !formData.start_date || !formData.due_date) {
      toast.error('⚠️ Tous les champs obligatoires doivent être remplis');
      return;
    }

    try {
      const taskData = {
        action_id: parseInt(formData.action_id),
        title_ar: formData.title_ar,
        description: formData.description || '',
        assigned_to: parseInt(formData.assigned_to) || user.id,
        priority: formData.priority,
        start_date: formData.start_date,
        due_date: formData.due_date,
        status: 'todo'
      };

      await taskApi.create(taskData);
      toast.success('✅ Tâche créée avec succès');
      setShowModal(false);
      setFormData({
        action_id: '',
        title_ar: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        start_date: '',
        due_date: '',
      });
      loadData();
    } catch (error) {
      console.error('❌ Erreur création:', error.response?.data || error);
      toast.error(`❌ ${error.response?.data?.message || 'Erreur lors de la création'}`);
    }
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    try {
      await taskApi.updateStatus(draggedTaskId, { status: newStatus });
      toast.success('✅ Statut mis à jour');
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === draggedTaskId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      toast.error('❌ Erreur lors du déplacement');
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    try {
      await taskApi.delete(taskId);
      toast.success('✅ Tâche supprimée');
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const priorityLabels = {
    low: '🟢 Basse',
    medium: '🔵 Moyenne',
    high: '🟠 Haute',
    urgent: '🔴 Urgente',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  // Compter les tâches totales
  const totalTasks = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  // Compter les tâches par action
  const getTaskCountByAction = (actionId) => {
    return tasks.filter(t => t.action_id === actionId).length;
  };

  return (
    <PageShell
      active="لوحة كانبان"
      title="لوحة كانبان"
      subtitle="تتبّع المهام عبر مراحل الإنجاز"
    >
      {/* En-tête avec compteur et filtre */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">📁 النشاط :</label>
            <select
              value={selectedActionId || ''}
              onChange={(e) => setSelectedActionId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e] text-sm"
            >
              <option value="">📊 Tous les projets ({totalTasks} tâches)</option>
              {actions.map((action) => {
                const taskCount = getTaskCountByAction(action.id);
                return (
                  <option key={action.id} value={action.id}>
                    {action.name_ar} (ID: {action.id}) - {taskCount} tâches
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-bold text-[#1a5b3e]">📊 Total: {totalTasks}</span>
            <span>📋 À faire: {todoCount}</span>
            <span>🔄 En cours: {inProgressCount}</span>
            <span>🔍 Révision: {reviewCount}</span>
            <span>✅ Terminé: {doneCount}</span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> مهمة جديدة
        </button>
      </div>

      {/* Message si aucune tâche */}
      {tasks.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center mb-4">
          <p className="text-blue-800 font-medium text-lg">📭 Aucune tâche trouvée</p>
          <p className="text-blue-600 text-sm mt-2">
            Cliquez sur "مهمة جديدة" pour créer votre première tâche.
          </p>
        </div>
      )}

      {/* Colonnes Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-slate-100/70 rounded-2xl p-3 min-h-[400px]"
            >
              <div className="flex items-center justify-between px-1.5 py-1 mb-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                  {column.title}
                  <span className="text-xs font-normal text-slate-400">({columnTasks.length})</span>
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const actionName = actions.find(a => a.id === task.action_id)?.name_ar || `ID: ${task.action_id}`;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                          task.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {priorityLabels[task.priority] || task.priority}
                        </span>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{task.title_ar}</p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {task.due_date}
                        </span>
                        <span className="text-slate-500 text-[10px] font-medium">
                          📁 {actionName}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    {column.id === 'todo' && '🚀 Glissez des tâches ici'}
                    {column.id === 'in_progress' && '⏳ Aucune tâche en cours'}
                    {column.id === 'review' && '📝 Aucune tâche en révision'}
                    {column.id === 'done' && '✅ Toutes les tâches sont terminées'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">➕ مهمة جديدة</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">النشاط *</label>
                  <select
                    value={formData.action_id}
                    onChange={(e) => setFormData({ ...formData, action_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                    required
                  >
                    <option value="">-- اختر نشاط --</option>
                    {actions.map((action) => (
                      <option key={action.id} value={action.id}>
                        {action.name_ar} (ID: {action.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">عنوان المهمة *</label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                    required
                    dir="rtl"
                    placeholder="أدخل عنوان المهمة"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                    rows="3"
                    dir="rtl"
                    placeholder="وصف المهمة"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">تعيين إلى</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                  >
                    <option value={user.id}>👤 أنا ({user.full_name || user.username})</option>
                    {users
                      .filter(u => u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.username}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 text-right">تاريخ البداية *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 text-right">تاريخ النهاية *</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-1 text-right">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]"
                  >
                    <option value="low">🟢 Basse</option>
                    <option value="medium">🔵 Moyenne</option>
                    <option value="high">🟠 Haute</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actions.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    actions.length === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#1a5b3e] text-white hover:bg-[#0f3d28]'
                  }`}
                >
                  {actions.length === 0 ? '⚠️ Aucune action' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Kanban;