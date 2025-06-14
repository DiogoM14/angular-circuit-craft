import { getNestedValue } from './data-utils.helper';

export function executeTransform(data: any, config: any): any {
  try {
    if (config.mappings && Array.isArray(config.mappings)) {
      const result: any = {};

      config.mappings.forEach((mapping: any) => {
        if (!mapping.enabled || !mapping.targetField) return;

        switch (mapping.type) {
          case 'direct':
            if (mapping.sourceField) {
              result[mapping.targetField] = getNestedValue(data, mapping.sourceField);
            }
            break;
          case 'constant':
            result[mapping.targetField] = mapping.value;
            break;
          case 'computed':
            try {
              result[mapping.targetField] = eval(mapping.value.replace(/data\./g, 'data.'));
            } catch (e) {
              result[mapping.targetField] = mapping.value;
            }
            break;
        }
      });

      return result;
    }

    const mappingObj = config.mapping ? JSON.parse(config.mapping) : {};
    console.log('Transforming data:', data, 'with mapping:', mappingObj);
    return { ...data, transformed: true, mapping: mappingObj };
  } catch (error) {
    throw new Error(`Transform error: ${error}`);
  }
}

export function generateTransformPreview(nodeId: string, transformMappings: { [nodeId: string]: any[] }, getInputPreview: (nodeId: string) => any, previewData: { [nodeId: string]: any }): any {
  const inputData = getInputPreview(nodeId);
  const mappings = transformMappings[nodeId];

  if (!inputData || !mappings) return null;

  const result: any = {};

  mappings.forEach(mapping => {
    if (!mapping.enabled || !mapping.targetField) return;

    switch (mapping.type) {
      case 'direct':
        if (mapping.sourceField) {
          result[mapping.targetField] = getNestedValue(inputData, mapping.sourceField);
        }
        break;
      case 'constant':
        result[mapping.targetField] = mapping.value;
        break;
      case 'computed':
        result[mapping.targetField] = mapping.value || 'computed_value';
        break;
    }
  });

  return result;
}

export function addTransformMapping(nodeId: string, transformMappings: { [nodeId: string]: any[] }): void {
  if (!transformMappings[nodeId]) {
    transformMappings[nodeId] = [];
  }

  transformMappings[nodeId].push({
    sourceField: '',
    targetField: '',
    type: 'direct',
    value: '',
    enabled: true
  });
}

export function removeTransformMapping(nodeId: string, index: number, transformMappings: { [nodeId: string]: any[] }): void {
  if (transformMappings[nodeId]) {
    transformMappings[nodeId].splice(index, 1);
  }
} 