import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../api/search.api';
import { toast } from 'react-toastify';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    priority: '',
  });
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Recherche
  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(value.length > 0);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchApi.search({
        q: value,
        type: filters.type,
        status: filters.status,
        priority: filters.priority,
      });
      setResults(response.data.results || {});
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      toast.error('❌ Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Gérer les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Naviguer vers l'élément
  const handleResultClick = (type, id) => {
    setShowResults(false);
    setQuery('');
    if (type === 'project') {
      navigate('/projects');
    } else if (type === 'task') {
      navigate('/kanban');
    } else if (type === 'user') {
      navigate('/admin/users');
    }
  };

  // Obtenir l'icône selon le type
  const getTypeIcon = (type) => {
    const icons = {
      project: '📁',
      action: '📋',
      task: '✅',
      user: '👤',
    };
    return icons[type] || '📌';
  };

  const totalResults = (results.projects?.length || 0) + 
                       (results.actions?.length || 0) + 
                       (results.tasks?.length || 0) + 
                       (results.users?.length || 0);

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.length > 0 && setShowResults(true)}
          placeholder="🔍 Rechercher..."
          className="w-64 md:w-80 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-card dark:text-dark-text dark:border-dark-border"
          dir="rtl"
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          {loading ? '⏳' : '🔍'}
        </div>
      </div>

      {/* Résultats */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {query.length < 2 ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">
              Tapez au moins 2 caractères
            </div>
          ) : loading ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              ⏳ Recherche en cours...
            </div>
          ) : totalResults === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              Aucun résultat trouvé
            </div>
          ) : (
            <>
              {/* Projets */}
              {results.projects && results.projects.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-700">
                  <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                    📁 Projets ({results.projects.length})
                  </div>
                  {results.projects.slice(0, 5).map((item) => (
                    <div
                      key={`project-${item.id}`}
                      onClick={() => handleResultClick('project', item.id)}
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3"
                    >
                      <span>{getTypeIcon('project')}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-dark-text">
                          {item.name_ar}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.status} • {item.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tâches */}
              {results.tasks && results.tasks.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-700">
                  <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                    ✅ Tâches ({results.tasks.length})
                  </div>
                  {results.tasks.slice(0, 5).map((item) => (
                    <div
                      key={`task-${item.id}`}
                      onClick={() => handleResultClick('task', item.id)}
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3"
                    >
                      <span>{getTypeIcon('task')}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-dark-text">
                          {item.title_ar}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.status} • {item.priority} • 📅 {item.due_date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Voir plus */}
              {totalResults > 5 && (
                <div className="px-4 py-2 text-center text-sm text-primary-600 hover:bg-gray-50 cursor-pointer">
                  Voir tous les résultats ({totalResults})
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;