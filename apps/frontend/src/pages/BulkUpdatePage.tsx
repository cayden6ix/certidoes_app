import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { parseInputToCents } from '@certidoes/shared';

import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useCertificateSelection } from '../contexts/CertificateSelectionContext';
import {
  bulkUpdateCertificates,
  listCertificateStatuses,
  listCertificateTags,
  type Certificate,
  type CertificateStatusConfig,
  type CertificateTag,
  type IndividualCertificateUpdate,
  type BulkUpdateCertificatesResponse,
} from '../lib/api';

/**
 * Campos que podem ser aplicados para todas as certidoes
 */
interface ApplyToAllFields {
  status: boolean;
  cost: boolean;
  additionalCost: boolean;
  priority: boolean;
}

/**
 * Valores globais dos campos quando "aplicar para todos" esta ativo
 */
interface GlobalFieldValues {
  status: string;
  cost: string;
  additionalCost: string;
  priority: 'normal' | 'urgent';
}

/**
 * Valores individuais por certidao
 */
interface IndividualFieldValues {
  [certificateId: string]: {
    status: string;
    cost: string;
    additionalCost: string;
    priority: 'normal' | 'urgent';
  };
}

/**
 * Componente de input monetario
 */
function MoneyInput({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id: string;
}): JSX.Element {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          // Permite apenas numeros e virgula
          const cleaned = e.target.value.replace(/[^\d,]/g, '');
          onChange(cleaned);
        }}
        disabled={disabled}
        placeholder="0,00"
        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
}

/**
 * Pagina de atualizacao em massa de certidoes
 */
export function BulkUpdatePage(): JSX.Element {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { selectedCertificates, clearSelection } = useCertificateSelection();

  // Estados para opcoes de selecao
  const [statuses, setStatuses] = useState<CertificateStatusConfig[]>([]);
  const [tags, setTags] = useState<CertificateTag[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Estados de formulario
  const [globalNotes, setGlobalNotes] = useState('');
  const [globalComment, setGlobalComment] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [applyToAll, setApplyToAll] = useState<ApplyToAllFields>({
    status: false,
    cost: false,
    additionalCost: false,
    priority: false,
  });
  const [globalValues, setGlobalValues] = useState<GlobalFieldValues>({
    status: '',
    cost: '',
    additionalCost: '',
    priority: 'normal',
  });
  const [individualValues, setIndividualValues] = useState<IndividualFieldValues>({});

  // Estados de submissao
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUpdateCertificatesResponse | null>(null);

  // Verifica se usuario e admin
  const isAdmin = user?.role === 'admin';

  // Redireciona se nao for admin ou nao houver certidoes selecionadas
  useEffect(() => {
    if (!isAdmin || selectedCertificates.length === 0) {
      void navigate('/dashboard');
    }
  }, [isAdmin, selectedCertificates.length, navigate]);

  // Identifica certidoes bloqueadas (status final ou nao editavel)
  const { editableCertificates, blockedCertificates } = useMemo(() => {
    const editable: Certificate[] = [];
    const blocked: Array<{ certificate: Certificate; reason: string }> = [];

    for (const cert of selectedCertificates) {
      if (cert.status.isFinal) {
        blocked.push({
          certificate: cert,
          reason: `Status final (${cert.status.displayName})`,
        });
      } else if (!cert.status.canEditCertificate) {
        blocked.push({
          certificate: cert,
          reason: `Status "${cert.status.displayName}" não permite edição`,
        });
      } else {
        editable.push(cert);
      }
    }

    return { editableCertificates: editable, blockedCertificates: blocked };
  }, [selectedCertificates]);

  // Inicializa valores individuais baseados nas certidoes
  useEffect(() => {
    const initialValues: IndividualFieldValues = {};
    for (const cert of editableCertificates) {
      initialValues[cert.id] = {
        status: cert.status.name,
        cost: cert.cost ? (cert.cost / 100).toFixed(2).replace('.', ',') : '',
        additionalCost: cert.additionalCost
          ? (cert.additionalCost / 100).toFixed(2).replace('.', ',')
          : '',
        priority: cert.priority,
      };
    }
    setIndividualValues(initialValues);
  }, [editableCertificates]);

  // Carrega opcoes de status e tags
  useEffect(() => {
    if (!token) return;

    const loadOptions = async (): Promise<void> => {
      setLoadingOptions(true);

      const [statusesResult, tagsResult] = await Promise.all([
        listCertificateStatuses(token, { includeInactive: false, limit: 100 }),
        listCertificateTags(token, { limit: 100 }),
      ]);

      if (statusesResult.data) {
        setStatuses(statusesResult.data.data);
      }

      if (tagsResult.data) {
        setTags(tagsResult.data.data);
      }

      setLoadingOptions(false);
    };

    void loadOptions();
  }, [token]);

  // Filtra status editaveis (nao finais)
  const editableStatuses = useMemo(() => {
    return statuses.filter((s) => !s.isFinal && s.canEditCertificate);
  }, [statuses]);

  // Toggles de tags
  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  // Atualiza valor individual
  const updateIndividualValue = useCallback(
    (
      certificateId: string,
      field: keyof IndividualFieldValues[string],
      value: IndividualFieldValues[string][keyof IndividualFieldValues[string]],
    ) => {
      setIndividualValues((prev) => ({
        ...prev,
        [certificateId]: {
          ...prev[certificateId],
          [field]: value,
        },
      }));
    },
    [],
  );

  // Handler de submissao
  const handleSubmit = useCallback(async () => {
    if (!token || editableCertificates.length === 0) return;

    setSubmitting(true);
    setError(null);

    // Monta os dados individuais
    const individualUpdates: IndividualCertificateUpdate[] = editableCertificates.map((cert) => {
      const individual = individualValues[cert.id];

      // Converte valores monetarios
      const parseMoney = (value: string): number | undefined => {
        if (!value || value.trim() === '') return undefined;
        const cents = parseInputToCents(value);
        return cents ?? undefined;
      };

      const update: IndividualCertificateUpdate = {
        certificateId: cert.id,
      };

      // Aplica valores globais ou individuais dependendo do toggle
      if (applyToAll.status && globalValues.status) {
        update.status = globalValues.status;
      } else if (individual?.status && individual.status !== cert.status.name) {
        update.status = individual.status;
      }

      if (applyToAll.cost) {
        const cost = parseMoney(globalValues.cost);
        if (cost !== undefined) update.cost = cost;
      } else {
        const cost = parseMoney(individual?.cost ?? '');
        if (cost !== undefined && cost !== cert.cost) update.cost = cost;
      }

      if (applyToAll.additionalCost) {
        const additionalCost = parseMoney(globalValues.additionalCost);
        if (additionalCost !== undefined) update.additionalCost = additionalCost;
      } else {
        const additionalCost = parseMoney(individual?.additionalCost ?? '');
        if (additionalCost !== undefined && additionalCost !== cert.additionalCost) {
          update.additionalCost = additionalCost;
        }
      }

      if (applyToAll.priority) {
        update.priority = globalValues.priority;
      } else if (individual?.priority && individual.priority !== cert.priority) {
        update.priority = individual.priority;
      }

      return update;
    });

    const response = await bulkUpdateCertificates(token, {
      certificateIds: editableCertificates.map((c) => c.id),
      globalData: {
        notes: globalNotes.trim() || undefined,
        tagIds: selectedTagIds.size > 0 ? Array.from(selectedTagIds) : undefined,
        comment: globalComment.trim() || undefined,
      },
      individualUpdates,
    });

    setSubmitting(false);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setResult(response.data);
    }
  }, [
    token,
    editableCertificates,
    individualValues,
    applyToAll,
    globalValues,
    globalNotes,
    globalComment,
    selectedTagIds,
  ]);

  // Handler para voltar ao dashboard
  const handleBack = useCallback(() => {
    if (result) {
      clearSelection();
    }
    void navigate('/dashboard');
  }, [navigate, clearSelection, result]);

  // Se nao houver certidoes selecionadas, mostra loading
  if (selectedCertificates.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  // Se resultado disponivel, mostra resumo
  if (result) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Resultado da Atualização</h1>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              Voltar ao Dashboard
            </button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-800">Atualizadas com sucesso</h3>
              <p className="mt-2 text-3xl font-bold text-green-900">{result.successCount}</p>
            </div>
            {result.failedCount > 0 && (
              <div className="rounded-lg bg-red-50 p-4">
                <h3 className="text-sm font-medium text-red-800">Falharam</h3>
                <p className="mt-2 text-3xl font-bold text-red-900">{result.failedCount}</p>
              </div>
            )}
            {result.blockedCount > 0 && (
              <div className="rounded-lg bg-yellow-50 p-4">
                <h3 className="text-sm font-medium text-yellow-800">Bloqueadas</h3>
                <p className="mt-2 text-3xl font-bold text-yellow-900">{result.blockedCount}</p>
              </div>
            )}
          </div>

          {/* Detalhes de falhas */}
          {result.failedCertificates.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Certidões que falharam:</h3>
              <ul className="mt-2 space-y-1">
                {result.failedCertificates.map((failed) => (
                  <li key={failed.certificateId} className="text-sm text-red-700">
                    Ficha {failed.recordNumber}: {failed.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detalhes de bloqueadas */}
          {result.blockedCertificates.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="text-sm font-medium text-yellow-800">Certidões bloqueadas:</h3>
              <ul className="mt-2 space-y-1">
                {result.blockedCertificates.map((blocked) => (
                  <li key={blocked.certificateId} className="text-sm text-yellow-700">
                    Ficha {blocked.recordNumber}: {blocked.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edição em Massa</h1>
            <p className="mt-1 text-sm text-gray-500">
              {editableCertificates.length} certidão(ões) selecionada(s) para edição
            </p>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>

        {/* Alerta de certidoes bloqueadas */}
        {blockedCertificates.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {blockedCertificates.length} certidão(ões) não podem ser editadas:
                </h3>
                <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                  {blockedCertificates.map(({ certificate, reason }) => (
                    <li key={certificate.id}>
                      Ficha {certificate.recordNumber}: {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loadingOptions ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-500">Carregando opções...</span>
          </div>
        ) : (
          <>
            {/* Secao de campos globais */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Campos Globais (aplicados a todas as certidões)
              </h2>

              <div className="space-y-4">
                {/* Observacoes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Observações
                  </label>
                  <textarea
                    id="notes"
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    rows={3}
                    placeholder="Adicione observações que serão aplicadas a todas as certidões..."
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                </div>

                {/* Comentario */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                    Comentário
                  </label>
                  <textarea
                    id="comment"
                    value={globalComment}
                    onChange={(e) => setGlobalComment(e.target.value)}
                    rows={3}
                    placeholder="Adicione um comentário que será adicionado a todas as certidões..."
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    O comentário será registrado no histórico de cada certidão
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.length === 0 ? (
                      <span className="text-sm text-gray-500">Nenhuma tag disponível</span>
                    ) : (
                      tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                            selectedTagIds.has(tag.id)
                              ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={
                            selectedTagIds.has(tag.id) && tag.color
                              ? { backgroundColor: tag.color + '33', borderColor: tag.color }
                              : undefined
                          }
                        >
                          {tag.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Secao de campos por certidao */}
            {editableCertificates.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Campos por Certidão</h2>

                {/* Toggles de aplicar para todos */}
                <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-gray-50 p-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyToAll.status}
                      onChange={(e) =>
                        setApplyToAll((prev) => ({ ...prev, status: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Aplicar status para todos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyToAll.cost}
                      onChange={(e) =>
                        setApplyToAll((prev) => ({ ...prev, cost: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Aplicar custo para todos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyToAll.additionalCost}
                      onChange={(e) =>
                        setApplyToAll((prev) => ({ ...prev, additionalCost: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      Aplicar custo adicional para todos
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={applyToAll.priority}
                      onChange={(e) =>
                        setApplyToAll((prev) => ({ ...prev, priority: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Aplicar prioridade para todos</span>
                  </label>
                </div>

                {/* Campos globais quando "aplicar para todos" */}
                {(applyToAll.status ||
                  applyToAll.cost ||
                  applyToAll.additionalCost ||
                  applyToAll.priority) && (
                  <div className="mb-4 grid grid-cols-1 gap-4 rounded-lg border border-primary-200 bg-primary-50 p-4 sm:grid-cols-4">
                    {applyToAll.status && (
                      <div>
                        <label
                          htmlFor="global-status"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Status Global
                        </label>
                        <select
                          id="global-status"
                          value={globalValues.status}
                          onChange={(e) =>
                            setGlobalValues((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                          <option value="">Selecione...</option>
                          {editableStatuses.map((status) => (
                            <option key={status.id} value={status.name}>
                              {status.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {applyToAll.cost && (
                      <div>
                        <label
                          htmlFor="global-cost"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Custo Global
                        </label>
                        <MoneyInput
                          id="global-cost"
                          value={globalValues.cost}
                          onChange={(v) => setGlobalValues((prev) => ({ ...prev, cost: v }))}
                        />
                      </div>
                    )}
                    {applyToAll.additionalCost && (
                      <div>
                        <label
                          htmlFor="global-additional-cost"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Custo Adicional Global
                        </label>
                        <MoneyInput
                          id="global-additional-cost"
                          value={globalValues.additionalCost}
                          onChange={(v) =>
                            setGlobalValues((prev) => ({ ...prev, additionalCost: v }))
                          }
                        />
                      </div>
                    )}
                    {applyToAll.priority && (
                      <div>
                        <label
                          htmlFor="global-priority"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Prioridade Global
                        </label>
                        <select
                          id="global-priority"
                          value={globalValues.priority}
                          onChange={(e) =>
                            setGlobalValues((prev) => ({
                              ...prev,
                              priority: e.target.value as 'normal' | 'urgent',
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabela de certidoes */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Ficha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Custo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Custo Adicional
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Prioridade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {editableCertificates.map((cert) => {
                        const individual = individualValues[cert.id];
                        return (
                          <tr key={cert.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                              {cert.recordNumber}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                              {cert.certificateType}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={applyToAll.status ? globalValues.status : individual?.status}
                                onChange={(e) =>
                                  updateIndividualValue(cert.id, 'status', e.target.value)
                                }
                                disabled={applyToAll.status}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                              >
                                {editableStatuses.map((status) => (
                                  <option key={status.id} value={status.name}>
                                    {status.displayName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <MoneyInput
                                id={`cost-${cert.id}`}
                                value={
                                  applyToAll.cost ? globalValues.cost : (individual?.cost ?? '')
                                }
                                onChange={(v) => updateIndividualValue(cert.id, 'cost', v)}
                                disabled={applyToAll.cost}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <MoneyInput
                                id={`additional-cost-${cert.id}`}
                                value={
                                  applyToAll.additionalCost
                                    ? globalValues.additionalCost
                                    : (individual?.additionalCost ?? '')
                                }
                                onChange={(v) =>
                                  updateIndividualValue(cert.id, 'additionalCost', v)
                                }
                                disabled={applyToAll.additionalCost}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={
                                  applyToAll.priority ? globalValues.priority : individual?.priority
                                }
                                onChange={(e) =>
                                  updateIndividualValue(
                                    cert.id,
                                    'priority',
                                    e.target.value as 'normal' | 'urgent',
                                  )
                                }
                                disabled={applyToAll.priority}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                              >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgente</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Botao de submit */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || editableCertificates.length === 0}
                className="rounded-md bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? 'Processando...'
                  : `Atualizar ${editableCertificates.length} Certidão(ões)`}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
