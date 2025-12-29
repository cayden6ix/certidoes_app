import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FilterDefinition } from '../constants/filter-config';
import { DEFAULT_FILTERS, OPTIONAL_FILTERS, LOCALSTORAGE_KEY } from '../constants/filter-config';
import type {
  CertificateStatusConfig,
  CertificateCatalogType,
  PaymentType,
  CertificateTag,
  AdminUser,
} from '../../../lib/api';

/**
 * Valores dos filtros
 */
export interface FilterValues {
  certificateType?: string;
  recordNumber?: string;
  status?: string;
  tags?: string[];
  paymentType?: string;
  paymentDate?: { from?: string; to?: string };
  orderNumber?: string;
  user?: string;
  commentSearch?: string;
  notes?: string;
  partiesName?: string;
}

interface ModularFiltersProps {
  filterValues: FilterValues;
  onFilterChange: (values: FilterValues) => void;
  statuses: CertificateStatusConfig[];
  certificateTypes: CertificateCatalogType[];
  paymentTypes: PaymentType[];
  tags: CertificateTag[];
  users: AdminUser[];
  loading?: boolean;
}

/**
 * Componente de filtros modulares
 * Permite adicionar/remover filtros opcionais e persiste no localStorage
 */
export function ModularFilters({
  filterValues,
  onFilterChange,
  statuses,
  certificateTypes,
  paymentTypes,
  tags,
  users,
  loading,
}: ModularFiltersProps): JSX.Element {
  // Carrega filtros opcionais salvos do localStorage
  const [activeOptionalFilters, setActiveOptionalFilters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
    } catch {
      return [];
    }
  });

  // Salva no localStorage quando filtros opcionais mudam
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(activeOptionalFilters));
  }, [activeOptionalFilters]);

  const addOptionalFilter = useCallback((filterId: string) => {
    setActiveOptionalFilters((prev) => [...prev, filterId]);
  }, []);

  const removeOptionalFilter = useCallback(
    (filterId: string) => {
      setActiveOptionalFilters((prev) => prev.filter((id) => id !== filterId));
      // Limpa o valor do filtro removido
      const newValues = { ...filterValues };
      delete newValues[filterId as keyof FilterValues];
      onFilterChange(newValues);
    },
    [filterValues, onFilterChange],
  );

  const handleFilterValueChange = useCallback(
    (filterId: string, value: string | string[] | { from?: string; to?: string }) => {
      onFilterChange({ ...filterValues, [filterId]: value });
    },
    [filterValues, onFilterChange],
  );

  const availableOptionalFilters = useMemo(() => {
    return OPTIONAL_FILTERS.filter((f) => !activeOptionalFilters.includes(f.id));
  }, [activeOptionalFilters]);

  const getOptionsForFilter = useCallback(
    (filterId: string): Array<{ id: string; name: string }> => {
      switch (filterId) {
        case 'certificateType':
          return certificateTypes.map((t) => ({ id: t.id, name: t.name }));
        case 'status':
          return statuses.map((s) => ({ id: s.id, name: s.displayName }));
        case 'paymentType':
          return paymentTypes.filter((p) => p.enabled).map((p) => ({ id: p.id, name: p.name }));
        default:
          return [];
      }
    },
    [certificateTypes, statuses, paymentTypes],
  );

  const renderMultiSelect = (filter: FilterDefinition, selectedValues: string[]): JSX.Element => {
    return (
      <div className="mt-1 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedValues.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                const newValues = isSelected
                  ? selectedValues.filter((id) => id !== tag.id)
                  : [...selectedValues, tag.id];
                handleFilterValueChange(filter.id, newValues);
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                isSelected && tag.color
                  ? { backgroundColor: tag.color + '30', borderColor: tag.color }
                  : undefined
              }
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    );
  };

  const renderFilter = (filter: FilterDefinition, isOptional: boolean = false): JSX.Element => {
    const value = filterValues[filter.id as keyof FilterValues];

    return (
      <div key={filter.id} className="relative">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{filter.label}</label>
          {isOptional && (
            <button
              type="button"
              onClick={() => removeOptionalFilter(filter.id)}
              className="text-gray-400 hover:text-red-500"
              title="Remover filtro"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {filter.type === 'text' && (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
            placeholder={filter.placeholder}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )}

        {filter.type === 'select' && (
          <select
            value={(value as string) ?? ''}
            onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">{filter.placeholder}</option>
            {getOptionsForFilter(filter.id).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        )}

        {filter.type === 'multi-select' && renderMultiSelect(filter, (value as string[]) ?? [])}

        {filter.type === 'date-range' && (
          <div className="mt-1 flex gap-2">
            <input
              type="date"
              value={(value as { from?: string; to?: string })?.from ?? ''}
              onChange={(e) =>
                handleFilterValueChange(filter.id, {
                  ...(value as { from?: string; to?: string }),
                  from: e.target.value,
                })
              }
              placeholder="De"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <input
              type="date"
              value={(value as { from?: string; to?: string })?.to ?? ''}
              onChange={(e) =>
                handleFilterValueChange(filter.id, {
                  ...(value as { from?: string; to?: string }),
                  to: e.target.value,
                })
              }
              placeholder="Até"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        )}

        {filter.type === 'user-select' && (
          <select
            value={(value as string) ?? ''}
            onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">{filter.placeholder}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        <span className="ml-2 text-sm text-gray-500">Carregando opções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros padrão */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEFAULT_FILTERS.map((filter) => renderFilter(filter))}
      </div>

      {/* Filtros opcionais ativos */}
      {activeOptionalFilters.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Filtros Adicionais</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeOptionalFilters.map((filterId) => {
              const filter = OPTIONAL_FILTERS.find((f) => f.id === filterId);
              return filter ? renderFilter(filter, true) : null;
            })}
          </div>
        </div>
      )}

      {/* Botão para adicionar filtros opcionais */}
      {availableOptionalFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Adicionar filtro:</span>
          <div className="flex flex-wrap gap-2">
            {availableOptionalFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => addOptionalFilter(filter.id)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
