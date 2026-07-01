import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { documentApi } from '../../api/document.api';
import { taskApi } from '../../api/task.api';
import { toast } from 'react-toastify';
import { Plus, Download, Trash2, FileText, Search } from 'lucide-react';

const Documents = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = async () => {
    try {
      const response = await documentApi.getAll();
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error('❌ Erreur chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await taskApi.getAll();
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadTasks();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('⚠️ Le fichier ne doit pas dépasser 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      await documentApi.upload({
        file: selectedFile,
        task_id: selectedTask || null,
      });
      toast.success('✅ Fichier uploadé avec succès');
      setSelectedFile(null);
      setSelectedTask('');
      document.getElementById('fileInput').value = '';
      loadDocuments();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const response = await documentApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('❌ Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await documentApi.delete(id);
      toast.success('✅ Document supprimé');
      loadDocuments();
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const getFileIcon = (extension) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      txt: '📃',
    };
    return icons[extension?.toLowerCase()] || '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <PageShell
      active="الوثائق"
      title="📄 الوثائق"
      subtitle={`${documents.length} documents au total`}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1 text-right">اختر ملف</label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
            />
            {selectedFile && (
              <div className="text-sm text-gray-500 mt-1 text-right">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm text-gray-600 mb-1 text-right">ربط بمهمة</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">بدون ربط</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title_ar}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="bg-[#1a5b3e] text-white px-6 py-2 rounded-lg hover:bg-[#0f3d28] transition-colors disabled:opacity-50"
          >
            {uploading ? 'جاري الرفع...' : 'رفع'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
            <input
              type="text"
              placeholder="بحث عن وثيقة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 text-sm rounded-xl pr-9 pl-3 py-2 outline-none focus:ring-2 focus:ring-[#1a5b3e]/30"
            />
          </div>
          <span className="text-sm text-slate-400">{filteredDocuments.length} documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوثيقة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحجم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهمة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رافع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <p className="text-lg">📂 Aucun document</p>
                    <p className="text-sm">Téléchargez votre premier document</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFileIcon(doc.extension)}</span>
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.extension?.toUpperCase() || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(doc.file_size)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.task?.title_ar || 'بدون ربط'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.user?.full_name || doc.user?.username}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(doc.id, doc.name)} className="text-blue-600 hover:text-blue-800">⬇️ تحميل</button>
                        {(isAdmin || isManager || doc.user_id === user?.id) && (
                          <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-800">🗑️ حذف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default Documents;