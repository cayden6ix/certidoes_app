import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  createCertificate,
  listCertificateTypes,
  type CertificateCatalogType,
  type CreateCertificateRequest,
} from '../lib/api';

/**
 * Página de Solicitação de Certidão
 * Permite que clientes criem novas solicitações de certidão
 */
export function RequestCertificatePage(): JSX.Element {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateCertificateRequest>({
    certificateType: '',
    recordNumber: '',
    partiesName: '',
    notes: '',
    priority: 'normal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<CertificateCatalogType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isActive = true;
    const fetchTypes = async (): Promise<void> => {
      setIsLoadingTypes(true);
      const response = await listCertificateTypes(token, { limit: 100 });

      if (!isActive) return;

      if (response.error || !response.data) {
        setTypesError(response.error ?? 'Não foi possível carregar os tipos de certidão.');
        setCertificateTypes([]);
      } else {
        setTypesError(null);
        const activeTypes = response.data.data.filter(
          (type) => type.isActive === undefined || type.isActive,
        );
        setCertificateTypes(activeTypes);
      }

      setIsLoadingTypes(false);
    };

    void fetchTypes();

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!token) {
      setError('Sessão expirada. Por favor, faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await createCertificate(token, {
      certificateType: formData.certificateType,
      recordNumber: formData.recordNumber,
      partiesName: formData.partiesName,
      notes: formData.notes ?? undefined,
      priority: formData.priority,
    });

    setIsSubmitting(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    setSuccess(true);

    // Redireciona para o dashboard após 2 segundos
    setTimeout(() => {
      void navigate('/dashboard');
    }, 2000);
  };

  if (success) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="rounded-lg bg-green-50 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-green-800">
              Solicitação enviada com sucesso!
            </h2>
            <p className="mt-2 text-green-600">Redirecionando para o dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Solicitar Certidão</h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Voltar ao Dashboard
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700">
                Tipo de Certidão <span className="text-red-500">*</span>
              </label>
              <select
                id="certificateType"
                name="certificateType"
                value={formData.certificateType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                required
                disabled={isSubmitting || isLoadingTypes}
              >
                <option value="">
                  {isLoadingTypes ? 'Carregando tipos...' : 'Selecione o tipo'}
                </option>
                {!isLoadingTypes && certificateTypes.length === 0 && (
                  <option value="" disabled>
                    Nenhum tipo disponível
                  </option>
                )}
                {certificateTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              {typesError && <p className="mt-1 text-sm text-red-600">{typesError}</p>}
            </div>

            <div>
              <label htmlFor="recordNumber" className="block text-sm font-medium text-gray-700">
                Nº da Ficha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="recordNumber"
                name="recordNumber"
                value={formData.recordNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                placeholder="Ex: 12345"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="partiesName" className="block text-sm font-medium text-gray-700">
                Nome das Partes <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="partiesName"
                name="partiesName"
                value={formData.partiesName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                placeholder="Nome completo das partes envolvidas"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                placeholder="Informações adicionais..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Prioridade
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                disabled={isSubmitting}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
              {formData.priority === 'urgent' && (
                <p className="mt-1 text-xs text-amber-600">
                  Solicitações urgentes podem ter custo adicional.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Solicitação'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
