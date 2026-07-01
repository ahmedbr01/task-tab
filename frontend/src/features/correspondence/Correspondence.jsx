import { useState, useEffect } from 'react';
import { PageShell } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { correspondenceApi } from '../../api/correspondence.api';
import { toast } from 'react-toastify';
import { Plus, Download, FileText, Trash2, Pencil, X, FileUp } from 'lucide-react';

const Correspondence = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [correspondences, setCorrespondences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCorrespondence, setEditingCorrespondence] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'internal_pdg',
    language: 'ar',
    title: '',
    content: '',
    recipient: '',
    recipient_position: '',
  });

  const types = [
    { value: 'internal_pdg', label: '📄 Note interne - PDG' },
    { value: 'internal_director', label: '📄 Note interne - Directeur' },
    { value: 'external_minister', label: '📤 Correspondance - Ministre' },
    { value: 'external_partner', label: '📤 Correspondance - Partenaire' },
  ];

  const statusLabels = { draft: '📝 Brouillon', generated: '✅ Généré', sent: '📨 Envoyé' };
  const statusColors = { draft: 'bg-yellow-100 text-yellow-800', generated: 'bg-green-100 text-green-800', sent: 'bg-blue-100 text-blue-800' };
  const languageLabels = { ar: '🇸🇦 Arabe', fr: '🇫🇷 Français' };

  const loadCorrespondences = async () => {
    try {
      const response = await correspondenceApi.getAll();
      setCorrespondences(response.data.correspondence || []);
    } catch (error) {
      toast.error('❌ Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCorrespondences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCorrespondence) {
        await correspondenceApi.update(editingCorrespondence.id, formData);
        toast.success('✅ Correspondance mise à jour');
      } else {
        await correspondenceApi.create(formData);
        toast.success('✅ Correspondance créée');
      }
      setShowModal(false);
      setEditingCorrespondence(null);
      setFormData({ type: 'internal_pdg', language: 'ar', title: '', content: '', recipient: '', recipient_position: '' });
      loadCorrespondences();
    } catch (error) {
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleGeneratePDF = async (id) => {
    setGenerating(true);
    try {
      await correspondenceApi.generatePDF(id);
      toast.success('✅ PDF généré');
      loadCorrespondences();
    } catch (error) {
      toast.error('❌ Erreur génération PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (id, reference) => {
    try {
      const response = await correspondenceApi.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `correspondance-${reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('❌ Erreur téléchargement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette correspondance ?')) return;
    try {
      await correspondenceApi.delete(id);
      toast.success('✅ Correspondance supprimée');
      loadCorrespondences();
    } catch (error) {
      toast.error('❌ Erreur suppression');
    }
  };

  const handleEdit = (correspondence) => {
    setEditingCorrespondence(correspondence);
    setFormData({
      type: correspondence.type,
      language: correspondence.language || 'ar',
      title: correspondence.title,
      content: correspondence.content,
      recipient: correspondence.recipient || '',
      recipient_position: correspondence.recipient_position || '',
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  return (
    <>
      <PageShell
        title="📄 المراسلات الإدارية"
        subtitle={`${correspondences.length} correspondances`}
      >
        {/* En-tête avec bouton d'ajout */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{correspondences.length} مراسلات</span>
          </div>
          {(isAdmin || isManager) && (
            <button
              onClick={() => {
                setEditingCorrespondence(null);
                setFormData({ type: 'internal_pdg', language: 'ar', title: '', content: '', recipient: '', recipient_position: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              مراسلة جديدة
            </button>
          )}
        </div>

        {/* Tableau des correspondances */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">المرجع</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">النوع</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">اللغة</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الموضوع</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">المستلم</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correspondences.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <p className="text-3xl mb-3">📄</p>
                      <p className="text-base text-slate-500">لا توجد مراسلات</p>
                      <p className="text-sm text-slate-400 mt-1">قم بإنشاء مراسلة جديدة</p>
                    </td>
                  </tr>
                ) : (
                  correspondences.map((corr) => (
                    <tr key={corr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800 font-mono">{corr.reference}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{types.find(t => t.value === corr.type)?.label || corr.type}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{languageLabels[corr.language]}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-800 max-w-[150px] block truncate">{corr.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{corr.recipient || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[corr.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabels[corr.status] || corr.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {(isAdmin || isManager) && (
                            <>
                              <button 
                                onClick={() => handleEdit(corr)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {corr.status === 'draft' && (
                                <button 
                                  onClick={() => handleGeneratePDF(corr.id)} 
                                  disabled={generating} 
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                  title="Générer PDF"
                                >
                                  <FileUp className="w-4 h-4" />
                                </button>
                              )}
                              {corr.status === 'generated' && (
                                <button 
                                  onClick={() => handleDownloadPDF(corr.id, corr.reference)} 
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title="Télécharger PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(corr.id)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">
                {editingCorrespondence ? '✏️ تعديل المراسلة' : '➕ مراسلة جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCorrespondence(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    نوع المراسلة *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    اللغة *
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                  >
                    <option value="ar">🇸🇦 Arabe (RTL)</option>
                    <option value="fr">🇫🇷 Français (LTR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    الموضوع *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    required
                    dir={formData.language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                    {formData.language === 'ar' ? 'المحتوى *' : 'Contenu *'}
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all resize-none"
                    rows="8"
                    required
                    dir={formData.language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                      {formData.language === 'ar' ? 'المستلم' : 'Destinataire'}
                    </label>
                    <input
                      type="text"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                      {formData.language === 'ar' ? 'صفة المستلم' : 'Fonction'}
                    </label>
                    <input
                      type="text"
                      value={formData.recipient_position}
                      onChange={(e) => setFormData({ ...formData, recipient_position: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5b3e]/30 focus:border-[#1a5b3e] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCorrespondence(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a5b3e] hover:bg-[#0f3d28] text-white rounded-xl transition-colors text-sm font-medium shadow-sm"
                >
                  {editingCorrespondence ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Correspondence;