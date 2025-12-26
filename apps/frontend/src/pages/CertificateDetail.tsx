import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  getCertificate,
  listCertificateEvents,
  listCertificateTags,
  listPaymentTypes,
  updateCertificate,
  updateCertificateTags,
  type Certificate,
  type CertificateEvent,
  type CertificateTag,
  type PaymentType,
} from '../lib/api';

const STATUS_CONFIG: Record<
  Certificate['status'],
  { label: string; bgColor: string; textColor: string }
> = {
  pending: { label: 'Pendente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  in_progress: { label: 'Em Andamento', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  completed: { label: 'Concluída', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  canceled: { label: 'Cancelada', bgColor: 'bg-red-100', textColor: 'text-red-800' },
};

const PRIORITY_CONFIG: Record<
  Certificate['priority'],
  { label: string; bgColor: string; textColor: string }
> = {
  normal: { label: 'Normal', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  urgent: { label: 'Urgente', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
};

function Badge({
  config,
}: {
  config: { label: string; bgColor: string; textColor: string };
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Calcula a cor de contraste (branco ou preto) baseado na cor de fundo
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1f2937' : '#ffffff';
}

function formatEventLabel(eventType: string): string {
  switch (eventType) {
    case 'created':
      return 'Solicitação criada';
    case 'status_changed':
      return 'Status atualizado';
    case 'updated':
      return 'Certidão atualizada';
    case 'tags_updated':
      return 'Tags atualizadas';
    default:
      return eventType;
  }
}

function formatFieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizeComparable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(normalizeComparable).join('|');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '[unknown]';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    return value.map(formatValue).join(', ');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '-';
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }
    const isToken = /^[a-z0-9_]+$/.test(trimmed);
    if (isToken && trimmed === trimmed.toLowerCase()) {
      return trimmed.replace(/_/g, ' ').toUpperCase();
    }
    return trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
  return '[unknown]';
}

/**
 * Formata transições de tags de forma específica
 * Mostra quais tags foram removidas e quais foram adicionadas
 */
function formatTagTransitions(before: unknown, after: unknown): string[] {
  const parseTagList = (value: unknown): string[] => {
    if (typeof value !== 'string') return [];
    if (value === 'Nenhuma' || value.trim() === '') return [];
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const beforeTags = parseTagList(before);
  const afterTags = parseTagList(after);

  // Calcula tags removidas e adicionadas
  const removedTags = beforeTags.filter((tag) => !afterTags.includes(tag));
  const addedTags = afterTags.filter((tag) => !beforeTags.includes(tag));

  const lines: string[] = [];

  // Se todas foram removidas e nenhuma adicionada
  if (removedTags.length > 0 && afterTags.length === 0) {
    lines.push(`Tags removidas: ${removedTags.join(', ')}`);
    lines.push('Tags atuais: Nenhuma');
    return lines;
  }

  // Se nenhuma havia antes e agora há
  if (beforeTags.length === 0 && addedTags.length > 0) {
    lines.push('Tags anteriores: Nenhuma');
    lines.push(`Tags adicionadas: ${addedTags.join(', ')}`);
    return lines;
  }

  // Caso geral: mostra removidas e adicionadas separadamente
  if (removedTags.length > 0) {
    lines.push(`Tags removidas: ${removedTags.join(', ')}`);
  }

  if (addedTags.length > 0) {
    lines.push(`Tags adicionadas: ${addedTags.join(', ')}`);
  }

  // Se não houve remoção nem adição mas os valores são diferentes (reordenação), mostra transição simples
  if (lines.length === 0 && beforeTags.join(',') !== afterTags.join(',')) {
    lines.push(
      `Tags: ${beforeTags.join(', ') || 'Nenhuma'} → ${afterTags.join(', ') || 'Nenhuma'}`,
    );
  }

  return lines;
}

function formatChanges(changes: Record<string, unknown> | null): string[] {
  if (!changes) return [];
  let entries = Object.entries(changes);
  if (
    entries.length === 1 &&
    (entries[0][0] === 'after' || entries[0][0] === 'before') &&
    entries[0][1] &&
    typeof entries[0][1] === 'object' &&
    !Array.isArray(entries[0][1])
  ) {
    entries = Object.entries(entries[0][1] as Record<string, unknown>);
  }

  const result: string[] = [];

  for (const [field, value] of entries) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'before' in value &&
      'after' in value
    ) {
      const before = (value as { before?: unknown }).before;
      const after = (value as { after?: unknown }).after;
      if (normalizeComparable(before) === normalizeComparable(after)) {
        continue;
      }

      // Tratamento especial para tags
      if (field === 'tags') {
        const tagLines = formatTagTransitions(before, after);
        result.push(...tagLines);
        continue;
      }

      result.push(`${formatFieldLabel(field)}: ${formatValue(before)} → ${formatValue(after)}`);
      continue;
    }
    if (value === undefined) continue;
    result.push(`${formatFieldLabel(field)}: ${formatValue(value)}`);
  }

  return result;
}

export function CertificateDetailPage(): JSX.Element {
  const { token, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [events, setEvents] = useState<CertificateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    status: '',
    cost: '',
    additionalCost: '',
    orderNumber: '',
    paymentDate: '',
    paymentTypeId: '',
  });
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);
  const [paymentTypesError, setPaymentTypesError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<CertificateTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isSavingTags, setIsSavingTags] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!token || !id) {
        setError('Certidão não encontrada.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const [certificateResult, eventsResult] = await Promise.all([
        getCertificate(token, id),
        listCertificateEvents(token, id),
      ]);

      if (certificateResult.error) {
        setError(certificateResult.error);
        setLoading(false);
        return;
      }

      setCertificate(certificateResult.data);
      if (certificateResult.data) {
        setAdminForm({
          status: certificateResult.data.status,
          cost: certificateResult.data.cost !== null ? certificateResult.data.cost.toString() : '',
          additionalCost:
            certificateResult.data.additionalCost !== null
              ? certificateResult.data.additionalCost.toString()
              : '',
          orderNumber: certificateResult.data.orderNumber ?? '',
          paymentDate: certificateResult.data.paymentDate
            ? certificateResult.data.paymentDate.slice(0, 10)
            : '',
          paymentTypeId: certificateResult.data.paymentTypeId ?? '',
        });
      }

      if (eventsResult.error) {
        setEvents([]);
      } else if (eventsResult.data) {
        setEvents(eventsResult.data);
      }

      setLoading(false);
    };

    void fetchData();
  }, [token, id]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    let active = true;
    const fetchPaymentTypes = async (): Promise<void> => {
      setLoadingPaymentTypes(true);
      const response = await listPaymentTypes(token, { limit: 100 });

      if (!active) return;

      if (response.error || !response.data) {
        setPaymentTypesError(response.error ?? 'Não foi possível carregar tipos de pagamento.');
        setPaymentTypes([]);
      } else {
        const enabled = response.data.data.filter(
          (type) => type.enabled === undefined || type.enabled,
        );
        setPaymentTypesError(null);
        setPaymentTypes(enabled);
      }

      setLoadingPaymentTypes(false);
    };

    void fetchPaymentTypes();

    return () => {
      active = false;
    };
  }, [token, isAdmin]);

  // Busca tags disponíveis para admin
  useEffect(() => {
    if (!token || !isAdmin) return;

    let active = true;
    const fetchTags = async (): Promise<void> => {
      setLoadingTags(true);
      const response = await listCertificateTags(token, { limit: 100 });

      if (!active) return;

      if (response.error || !response.data) {
        setTagsError(response.error ?? 'Não foi possível carregar tags.');
        setAvailableTags([]);
      } else {
        setTagsError(null);
        setAvailableTags(response.data.data);
      }

      setLoadingTags(false);
    };

    void fetchTags();

    return () => {
      active = false;
    };
  }, [token, isAdmin]);

  // Inicializa tags selecionadas quando o certificado for carregado
  useEffect(() => {
    if (certificate?.tags) {
      setSelectedTagIds(certificate.tags.map((tag) => tag.id));
    }
  }, [certificate?.tags]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [events]);

  if (!token) {
    return (
      <Layout>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">
            Sessão expirada. Faça login novamente para ver os detalhes.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            Ir para login
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center rounded-lg bg-white p-12 shadow">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-500">Carregando detalhes...</span>
        </div>
      </Layout>
    );
  }

  if (error || !certificate) {
    return (
      <Layout>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-red-600">{error ?? 'Erro ao carregar certidão.'}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar ao dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhe da Certidão</h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: <span className="font-mono text-xs">{certificate.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tipo</p>
                  <p className="mt-1 text-sm text-gray-900">{certificate.certificateType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Nº da Ficha
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{certificate.recordNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <div className="mt-1">
                    <Badge config={STATUS_CONFIG[certificate.status]} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Prioridade
                  </p>
                  <div className="mt-1">
                    <Badge config={PRIORITY_CONFIG[certificate.priority]} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Tipo de pagamento
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {certificate.paymentType ?? 'Não informado'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tags</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {certificate.tags && certificate.tags.length > 0 ? (
                      certificate.tags.map((tag) => {
                        const hasColor = tag.color?.startsWith('#');
                        return (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={
                              hasColor
                                ? {
                                    backgroundColor: tag.color!,
                                    color: getContrastColor(tag.color!),
                                  }
                                : { backgroundColor: '#e5e7eb', color: '#374151' }
                            }
                          >
                            {tag.name}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-500">Nenhuma tag</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Partes e Observações</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Nome das Partes
                  </p>
                  <p className="mt-1 text-sm text-gray-900">{certificate.partiesName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Observações
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {certificate.notes ?? 'Sem observações.'}
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Campos Administrativos</h2>
                  <span className="text-xs text-gray-500">Somente admins podem editar</span>
                </div>
                <form
                  className="mt-4 grid gap-4 sm:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!token) return;

                    setIsSaving(true);
                    setSaveError(null);

                    const payload = {
                      status:
                        adminForm.status && adminForm.status !== certificate.status
                          ? (adminForm.status as Certificate['status'])
                          : undefined,
                      cost: adminForm.cost !== '' ? parseFloat(adminForm.cost) : undefined,
                      additionalCost:
                        adminForm.additionalCost !== ''
                          ? parseFloat(adminForm.additionalCost)
                          : undefined,
                      orderNumber:
                        adminForm.orderNumber.trim() !== ''
                          ? adminForm.orderNumber.trim()
                          : undefined,
                      paymentDate: adminForm.paymentDate !== '' ? adminForm.paymentDate : undefined,
                      paymentTypeId: adminForm.paymentTypeId,
                    };

                    const response = await updateCertificate(token, certificate.id, payload);

                    if (response.error) {
                      setSaveError(response.error);
                      setIsSaving(false);
                      return;
                    }

                    if (response.data) {
                      const updatedData = response.data;
                      setCertificate(updatedData);
                      setAdminForm((prev) => ({
                        ...prev,
                        status: updatedData.status,
                        cost: updatedData.cost !== null ? updatedData.cost.toString() : '',
                        additionalCost:
                          updatedData.additionalCost !== null
                            ? updatedData.additionalCost.toString()
                            : '',
                        orderNumber: updatedData.orderNumber ?? '',
                        paymentDate: updatedData.paymentDate
                          ? updatedData.paymentDate.slice(0, 10)
                          : '',
                        paymentTypeId: updatedData.paymentTypeId ?? '',
                      }));
                    }

                    const eventsResult = await listCertificateEvents(token, certificate.id);
                    if (!eventsResult.error && eventsResult.data) {
                      setEvents(eventsResult.data);
                    }

                    setIsSaving(false);
                  }}
                >
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      value={adminForm.status}
                      onChange={(event) => {
                        setAdminForm((prev) => ({ ...prev, status: event.target.value }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving}
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                      <option value="canceled">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="orderNumber"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Nº do pedido
                    </label>
                    <input
                      id="orderNumber"
                      type="text"
                      value={adminForm.orderNumber}
                      onChange={(event) => {
                        setAdminForm((prev) => ({ ...prev, orderNumber: event.target.value }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cost"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Custo
                    </label>
                    <input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={adminForm.cost}
                      onChange={(event) => {
                        setAdminForm((prev) => ({ ...prev, cost: event.target.value }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="additionalCost"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Custo adicional
                    </label>
                    <input
                      id="additionalCost"
                      type="number"
                      step="0.01"
                      value={adminForm.additionalCost}
                      onChange={(event) => {
                        setAdminForm((prev) => ({
                          ...prev,
                          additionalCost: event.target.value,
                        }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="paymentDate"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Data de pagamento
                    </label>
                    <input
                      id="paymentDate"
                      type="date"
                      value={adminForm.paymentDate}
                      onChange={(event) => {
                        setAdminForm((prev) => ({
                          ...prev,
                          paymentDate: event.target.value,
                        }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="paymentType"
                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Tipo de pagamento
                    </label>
                    <select
                      id="paymentType"
                      value={adminForm.paymentTypeId}
                      onChange={(event) => {
                        setAdminForm((prev) => ({
                          ...prev,
                          paymentTypeId: event.target.value,
                        }));
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      disabled={isSaving || loadingPaymentTypes}
                    >
                      <option value="">
                        {loadingPaymentTypes ? 'Carregando tipos...' : 'Selecione'}
                      </option>
                      {!loadingPaymentTypes && paymentTypes.length === 0 && (
                        <option value="" disabled>
                          Nenhum tipo disponível
                        </option>
                      )}
                      {paymentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {paymentTypesError && (
                      <p className="mt-1 text-xs text-red-600">{paymentTypesError}</p>
                    )}
                  </div>
                  <div className="flex items-end justify-between sm:col-span-2">
                    {saveError ? (
                      <p className="text-sm text-red-600">{saveError}</p>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Atualizações serão registradas na timeline.
                      </span>
                    )}
                    <button
                      type="submit"
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </form>

                {/* Seção de Tags */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
                      {selectedTagIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTagIds([])}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                          disabled={isSavingTags}
                        >
                          Limpar todas
                        </button>
                      )}
                      {selectedTagIds.length === 0 && !loadingTags && availableTags.length > 0 && (
                        <span className="text-xs text-gray-400">Sem tags selecionadas</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!token || !certificate) return;
                        setIsSavingTags(true);
                        const response = await updateCertificateTags(
                          token,
                          certificate.id,
                          selectedTagIds,
                        );
                        if (response.error) {
                          setTagsError(response.error);
                        } else {
                          setTagsError(null);
                          // Recarrega o certificado e eventos para atualizar as tags e timeline
                          const [certResult, eventsResult] = await Promise.all([
                            getCertificate(token, certificate.id),
                            listCertificateEvents(token, certificate.id),
                          ]);
                          if (certResult.data) {
                            setCertificate(certResult.data);
                          }
                          if (!eventsResult.error && eventsResult.data) {
                            setEvents(eventsResult.data);
                          }
                        }
                        setIsSavingTags(false);
                      }}
                      disabled={isSavingTags || loadingTags}
                      className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingTags ? 'Salvando...' : 'Salvar tags'}
                    </button>
                  </div>
                  {tagsError && <p className="mt-2 text-xs text-red-600">{tagsError}</p>}
                  {loadingTags ? (
                    <p className="mt-3 text-sm text-gray-500">Carregando tags...</p>
                  ) : availableTags.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">
                      Nenhuma tag disponível. Crie tags no painel administrativo.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        const hasColor = tag.color?.startsWith('#');
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setSelectedTagIds((prev) =>
                                isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                              );
                            }}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-primary-500 ring-offset-1'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={
                              hasColor
                                ? {
                                    backgroundColor: tag.color!,
                                    color: getContrastColor(tag.color!),
                                  }
                                : undefined
                            }
                          >
                            {!hasColor && (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  isSelected
                                    ? 'bg-gray-200 text-gray-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {tag.name}
                              </span>
                            )}
                            {hasColor && tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Dados Administrativos</h2>
                  <span className="text-xs text-gray-500">Somente leitura</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </p>
                    <div className="mt-1">
                      <Badge config={STATUS_CONFIG[certificate.status]} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Nº do pedido
                    </p>
                    <p className="mt-1 text-sm text-gray-900">{certificate.orderNumber ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Custo
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {certificate.cost !== null ? `R$ ${certificate.cost.toFixed(2)}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Custo adicional
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {certificate.additionalCost !== null
                        ? `R$ ${certificate.additionalCost.toFixed(2)}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Data de pagamento
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {certificate.paymentDate
                        ? new Date(certificate.paymentDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tipo de pagamento
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {certificate.paymentType ?? 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            {sortedEvents.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Nenhum evento registrado.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {sortedEvents.map((event) => {
                  const changeLines = formatChanges(event.changes);
                  const actorId = event.actorUserId ? event.actorUserId.slice(0, 8) : '';
                  return (
                    <div key={event.id} className="rounded-md border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatEventLabel(event.eventType)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.actorRole === 'admin' ? 'Admin' : 'Cliente'}
                            {actorId ? ` (${actorId})` : ''} •{' '}
                            {new Date(event.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-400">
                          #{event.id.slice(0, 6)}
                        </span>
                      </div>
                      {changeLines.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {changeLines.map((line, index) => (
                            <li key={`${event.id}-change-${index}`}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
