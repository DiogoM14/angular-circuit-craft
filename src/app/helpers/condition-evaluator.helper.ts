import { getNestedValue } from './data-utils.helper';

export function executeIfCondition(data: any, config: any): any {
  try {
    console.log('Executing if-condition with data:', data, 'and condition:', config.condition);
    
    if (!config.condition || config.condition.trim() === '') {
      return {
        result: true,
        data: data,
        conditionEvaluated: 'true (no condition set)',
        executionPath: 'true'
      };
    }

    const conditionResult = evaluateCondition(data, config.condition);
    
    return {
      result: conditionResult,
      data: data,
      conditionEvaluated: config.condition,
      executionPath: conditionResult ? 'true' : 'false'
    };
  } catch (error) {
    throw new Error(`If-condition error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function evaluateCondition(data: any, condition: string): boolean {
  try {
    let processedCondition = condition;
    
    if (data !== null && typeof data === 'object') {
      processedCondition = processedCondition.replace(/data\.(\w+)/g, (match, field) => {
        const value = getNestedValue(data, field);
        return typeof value === 'string' ? `"${value}"` : String(value);
      });
    }
    
    if (processedCondition.includes('data') && !processedCondition.includes('data.')) {
      const dataValue = typeof data === 'string' ? `"${data}"` : String(data);
      processedCondition = processedCondition.replace(/\bdata\b/g, dataValue);
    }
    
    console.log('Evaluating condition:', processedCondition);
    
    if (processedCondition.includes('===') || processedCondition.includes('==')) {
      return evaluateSimpleComparison(processedCondition);
    }
    
    if (processedCondition.includes('>') || processedCondition.includes('<')) {
      return evaluateNumericComparison(processedCondition);
    }
    
    if (processedCondition === 'true' || processedCondition === 'false') {
      return processedCondition === 'true';
    }
    
    const result = new Function('return ' + processedCondition)();
    return Boolean(result);
    
  } catch (error) {
    console.warn('Condition evaluation error:', error, 'defaulting to false');
    return false;
  }
}

function evaluateSimpleComparison(condition: string): boolean {
  try {
    const eqMatch = condition.match(/(.+?)\s*(===|==)\s*(.+)/);
    if (eqMatch) {
      const left = eqMatch[1].trim().replace(/"/g, '');
      const operator = eqMatch[2];
      const right = eqMatch[3].trim().replace(/"/g, '');
      
      if (operator === '===') {
        return left === right;
      } else {
        return left == right;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

function evaluateNumericComparison(condition: string): boolean {
  try {
    const numMatch = condition.match(/(.+?)\s*(>=|<=|>|<)\s*(.+)/);
    if (numMatch) {
      const left = parseFloat(numMatch[1].trim());
      const operator = numMatch[2];
      const right = parseFloat(numMatch[3].trim());
      
      if (isNaN(left) || isNaN(right)) return false;
      
      switch (operator) {
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
} 