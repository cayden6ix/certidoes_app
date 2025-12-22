import { useState } from 'react';

import { Layout } from '../components/Layout';

/**
 * Página de Solicitação de Certidão (placeholder)
 * Será completamente implementada na Sprint 3
 */
export function RequestCertificatePage(): JSX.Element {
  const [formData, setFormData] = useState({
    certificateType: '',
    recordNumber: '',
    partiesName: '',
    notes: '',
    priority: 'normal',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // TODO: Implementar envio para API na Sprint 3
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitar Certidão</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="certificateType"
                className="block text-sm font-medium text-gray-700"
              >
                Tipo de Certidão
              </label>
              <select
                id="certificateType"
                name="certificateType"
                value={formData.certificateType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Selecione o tipo</option>
                <option value="nascimento">Certidão de Nascimento</option>
                <option value="casamento">Certidão de Casamento</option>
                <option value="obito">Certidão de Óbito</option>
                <option value="inteiro_teor">Inteiro Teor</option>
              </select>
            </div>

            <div>
              <label htmlFor="recordNumber" className="block text-sm font-medium text-gray-700">
                Nº da Ficha
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
              />
            </div>

            <div>
              <label htmlFor="partiesName" className="block text-sm font-medium text-gray-700">
                Nome das Partes
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
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Enviar Solicitação
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Funcionalidade completa será implementada na Sprint 3
          </p>
        </div>
      </div>
    </Layout>
  );
}
