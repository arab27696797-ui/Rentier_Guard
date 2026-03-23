/**
 * @fileoverview Типы и интерфейсы для модуля объектов недвижимости
 * @module modules/property/types
 */

import { Context } from 'telegraf';
import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes';

// ============================================
// ENUMS
// ============================================

/** Тип объекта недвижимости */
export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

/** Налоговый режим */
export enum TaxRegime {
  NDFL = 'NDFL',              // НДФЛ 13%
  SELF_EMPLOYED = 'SELF_EMPLOYED',  // Самозанятый 4-6%
  PATENT = 'PATENT',          // Патент
  IP = 'IP',                  // ИП УСН
}

// ============================================
// INTERFACES
// ============================================

/** Объект недвижимости */
export interface Property {
  id: string;
  userId: number;
  address: string;
  cadastralNumber: string | null;
  type: PropertyType;
  taxRegime: TaxRegime;
  createdAt: Date;
  updatedAt: Date;
}

/** Данные для создания объекта */
export interface CreatePropertyInput {
  userId: number;
  address: string;
  cadastralNumber?: string;
  type: PropertyType;
  taxRegime: TaxRegime;
}

/** Данные для обновления объекта */
export interface UpdatePropertyInput {
  address?: string;
  cadastralNumber?: string | null;
  type?: PropertyType;
  taxRegime?: TaxRegime;
}

/** Расширенный контекст для сцен объекта недвижимости */
export interface PropertyWizardContext extends WizardContext {
  session: WizardSessionData & {
    propertyData?: {
      address?: string;
      cadastralNumber?: string;
      type?: PropertyType;
      taxRegime?: TaxRegime;
    };
    selectedPropertyId?: string;
  };
}

// ============================================
// CONSTANTS
// ============================================

/** Лейблы для типов недвижимости */
export const PropertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.RESIDENTIAL]: '🏠 Жилое',
  [PropertyType.COMMERCIAL]: '🏢 Коммерческое',
};

/** Лейблы для налоговых режимов */
export const TaxRegimeLabels: Record<TaxRegime, string> = {
  [TaxRegime.NDFL]: '📊 НДФЛ (13%)',
  [TaxRegime.SELF_EMPLOYED]: '💼 Самозанятый (4-6%)',
  [TaxRegime.PATENT]: '📜 Патент',
  [TaxRegime.IP]: '🏢 ИП УСН',
};

/** Описания налоговых режимов */
export const TaxRegimeDescriptions: Record<TaxRegime, string> = {
  [TaxRegime.NDFL]: 'Налог на доходы физических лиц - 13% от арендной платы',
  [TaxRegime.SELF_EMPLOYED]: 'Налог на профессиональный доход - 4% от физлиц, 6% от юрлиц',
  [TaxRegime.PATENT]: 'Патентная система - фиксированная сумма в год',
  [TaxRegime.IP]: 'Индивидуальный предприниматель на УСН',
};
