/**
 * @fileoverview Экспорт модуля объектов недвижимости
 * @module modules/property
 */

// ============================================
// TYPES
// ============================================

export {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyWizardContext,
  PropertyType,
  TaxRegime,
  PropertyTypeLabels,
  TaxRegimeLabels,
  TaxRegimeDescriptions,
} from './types';

// ============================================
// VALIDATORS
// ============================================

export {
  addressSchema,
  cadastralNumberSchema,
  propertyTypeSchema,
  taxRegimeSchema,
  propertyIdSchema,
  createPropertySchema,
  updatePropertySchema,
  CreatePropertySchema,
  UpdatePropertySchema,
} from './validators';

// ============================================
// SCENES
// ============================================

export {
  addPropertyScene,
  ADD_PROPERTY_SCENE,
} from './scenes/addProperty.scene';

export {
  myPropertiesScene,
  MY_PROPERTIES_SCENE,
} from './scenes/myProperties.scene';

// ============================================
// SERVICES
// ============================================

export { propertyService } from './services/property.service';

// ============================================
// TEMPLATES
// ============================================

export { messages as propertyMessages } from './templates/messages';

// ============================================
// SCENE LIST (для регистрации в боте)
// ============================================

import { addPropertyScene } from './scenes/addProperty.scene';
import { myPropertiesScene } from './scenes/myProperties.scene';

export const propertyScenes = [
  addPropertyScene,
  myPropertiesScene,
];
