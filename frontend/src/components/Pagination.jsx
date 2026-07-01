const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  limit, 
  onLimitChange,
  total,
  showLimit = true 
}) => {
  const pageNumbers = [];

  // Générer les numéros de page
  const maxPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Informations */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {total > 0 ? (
          <>Affichage de {((currentPage - 1) * limit) + 1} à {Math.min(currentPage * limit, total)} sur {total} résultats</>
        ) : (
          <>Aucun résultat</>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Selecteur de limite */}
        {showLimit && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Par page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-card dark:text-dark-text text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex items-center gap-1">
          {/* Première page */}
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>

          {/* Page précédente */}
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>

          {/* Numéros de page */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageClick(1)}
                className="px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-400">…</span>}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageClick(number)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                number === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-gray-400">…</span>}
              <button
                onClick={() => handlePageClick(totalPages)}
                className="px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Page suivante */}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>

          {/* Dernière page */}
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;