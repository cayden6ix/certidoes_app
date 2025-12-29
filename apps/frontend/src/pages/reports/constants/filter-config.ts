/**
 * Configuração de filtros para a página de relatórios
 * Define os filtros padrão (sempre visíveis) e opcionais (adicionáveis)
 */

/**
 * Definição de um filtro
 */
export interface FilterDefinition {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'date-range' | 'user-select';
  isDefault: boolean;
  apiKey: string;
  placeholder?: string;
}

/**
 * Filtros padrão - sempre visíveis na interface
 */
export const DEFAULT_FILTERS: FilterDefinition[] = [
  {
    id: 'certificateType',
    label: 'Tipo de Certidão',
    type: 'select',
    isDefault: true,
    apiKey: 'certificateTypeId',
    placeholder: 'Todos os tipos',
  },
  {
    id: 'recordNumber',
    label: 'Ficha/Nº Registro',
    type: 'text',
    isDefault: true,
    apiKey: 'recordNumber',
    placeholder: 'Buscar por ficha...',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    isDefault: true,
    apiKey: 'statusId',
    placeholder: 'Todos os status',
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'multi-select',
    isDefault: true,
    apiKey: 'tagIds',
    placeholder: 'Selecionar tags...',
  },
  {
    id: 'paymentType',
    label: 'Tipo de Pagamento',
    type: 'select',
    isDefault: true,
    apiKey: 'paymentTypeId',
    placeholder: 'Todos os pagamentos',
  },
  {
    id: 'paymentDate',
    label: 'Data de Pagamento',
    type: 'date-range',
    isDefault: true,
    apiKey: 'paymentDate',
  },
];

/**
 * Filtros opcionais - usuário pode adicionar conforme necessidade
 */
export const OPTIONAL_FILTERS: FilterDefinition[] = [
  {
    id: 'orderNumber',
    label: 'Nº do Pedido',
    type: 'text',
    isDefault: false,
    apiKey: 'orderNumber',
    placeholder: 'Buscar por pedido...',
  },
  {
    id: 'user',
    label: 'Usuário que solicitou',
    type: 'user-select',
    isDefault: false,
    apiKey: 'userId',
    placeholder: 'Selecionar usuário...',
  },
  {
    id: 'commentSearch',
    label: 'Palavra em comentário',
    type: 'text',
    isDefault: false,
    apiKey: 'commentSearch',
    placeholder: 'Buscar em comentários...',
  },
  {
    id: 'notes',
    label: 'Observações',
    type: 'text',
    isDefault: false,
    apiKey: 'notesSearch',
    placeholder: 'Buscar em observações...',
  },
  {
    id: 'partiesName',
    label: 'Nome das Partes',
    type: 'text',
    isDefault: false,
    apiKey: 'partiesNameSearch',
    placeholder: 'Buscar nome...',
  },
];

/**
 * Chave do localStorage para persistir filtros opcionais selecionados
 */
export const LOCALSTORAGE_KEY = 'admin_reports_optional_filters';
