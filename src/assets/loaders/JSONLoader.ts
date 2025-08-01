import { BaseAssetLoader } from './BaseAssetLoader';
import { AssetConfig, AssetType } from '../../contracts/AssetManager';

/**
 * JSON validation schema interface.
 */
export interface JSONSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * JSON loading options.
 */
export interface JSONLoadOptions {
  /** Validation schema for the JSON data */
  schema?: JSONSchema;
  /** Transform function to apply to loaded data */
  transform?: (data: any) => any;
  /** Enable data compression detection */
  detectCompression?: boolean;
  /** Maximum allowed JSON size in bytes */
  maxSize?: number;
  /** Enable strict JSON parsing */
  strict?: boolean;
}

/**
 * Processed JSON data.
 */
export interface ProcessedJSON<T = any> {
  data: T;
  size: number;
  compressed: boolean;
  valid: boolean;
  validationErrors?: string[];
  metadata?: {
    keys: number;
    depth: number;
    type: string;
  };
}

/**
 * JSON asset loader with validation and transformation capabilities.
 * Optimized for configuration files, game data, and API responses.
 */
export class JSONLoader extends BaseAssetLoader<ProcessedJSON> {
  readonly supportedTypes = [AssetType.JSON];
  
  /**
   * Load and process a JSON asset.
   */
  async load(config: AssetConfig): Promise<ProcessedJSON> {
    if (!this.canLoad(config.type)) {
      throw new Error(`JSONLoader cannot load assets of type: ${config.type}`);
    }
    
    try {
      // Load JSON data as text for better control
      const text = await this.loadWithXHR(config, 'text') as string;
      
      // Process JSON with options
      const processed = await this.processJSON(text, config);
      
      this.emit('loaded', { assetId: config.id, json: processed });
      return processed;
      
    } catch (error) {
      this.emit('failed', { assetId: config.id, error });
      throw error;
    }
  }
  
  /**
   * Process JSON text with validation and transformation.
   */
  private async processJSON(text: string, config: AssetConfig): Promise<ProcessedJSON> {
    const options = config.options as JSONLoadOptions || {};
    
    // Check size limits
    if (options.maxSize && text.length > options.maxSize) {
      throw new Error(`JSON size (${text.length} bytes) exceeds maximum allowed size (${options.maxSize} bytes)`);
    }
    
    // Detect compression
    const compressed = this.detectCompression(text);
    
    // Parse JSON
    let data: any;
    try {
      data = this.parseJSON(text, options.strict);
    } catch (error) {
      throw new Error(`JSON parsing failed: ${(error as Error).message}`);
    }
    
    // Apply transformation if provided
    if (options.transform) {
      try {
        data = options.transform(data);
      } catch (error) {
        throw new Error(`JSON transformation failed: ${(error as Error).message}`);
      }
    }
    
    // Validate against schema if provided
    const validation = options.schema ? this.validateJSON(data, options.schema) : { valid: true };
    
    // Generate metadata
    const metadata = this.generateMetadata(data);
    
    return {
      data,
      size: text.length,
      compressed,
      valid: validation.valid,
      validationErrors: validation.errors,
      metadata
    };
  }
  
  /**
   * Parse JSON with optional strict mode.
   */
  private parseJSON(text: string, strict: boolean = false): any {
    if (strict) {
      // Strict parsing: no comments, trailing commas, etc.
      return JSON.parse(text);
    }
    
    // Relaxed parsing: handle common JSON extensions
    const cleanedText = this.cleanJSON(text);
    return JSON.parse(cleanedText);
  }
  
  /**
   * Clean JSON text to handle common extensions.
   */
  private cleanJSON(text: string): string {
    // Remove single-line comments
    text = text.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove trailing commas (basic implementation)
    text = text.replace(/,(\s*[}\]])/g, '$1');
    
    return text;
  }
  
  /**
   * Validate JSON data against schema.
   */
  private validateJSON(data: any, schema: JSONSchema): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    if (!this.validateValue(data, schema, '', errors)) {
      return { valid: false, errors };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate a value against a schema.
   */
  private validateValue(value: any, schema: JSONSchema, path: string, errors: string[]): boolean {
    let valid = true;
    
    // Type validation
    if (schema.type) {
      const actualType = this.getValueType(value);
      if (actualType !== schema.type) {
        errors.push(`${path}: Expected type '${schema.type}', got '${actualType}'`);
        valid = false;
      }
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path}: Value must be one of: ${schema.enum.join(', ')}`);
      valid = false;
    }
    
    // String validations
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path}: String length must be at least ${schema.minLength}`);
        valid = false;
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path}: String length must not exceed ${schema.maxLength}`);
        valid = false;
      }
    }
    
    // Number validations
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path}: Value must be at least ${schema.minimum}`);
        valid = false;
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path}: Value must not exceed ${schema.maximum}`);
        valid = false;
      }
    }
    
    // Object validations
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      if (schema.required) {
        for (const requiredKey of schema.required) {
          if (!(requiredKey in value)) {
            errors.push(`${path}: Missing required property '${requiredKey}'`);
            valid = false;
          }
        }
      }
      
      if (schema.properties) {
        for (const [key, subSchema] of Object.entries(schema.properties)) {
          if (key in value) {
            const subPath = path ? `${path}.${key}` : key;
            if (!this.validateValue(value[key], subSchema, subPath, errors)) {
              valid = false;
            }
          }
        }
      }
    }
    
    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
      if (schema.items) {
        value.forEach((item, index) => {
          const subPath = `${path}[${index}]`;
          if (!this.validateValue(item, schema.items!, subPath, errors)) {
            valid = false;
          }
        });
      }
    }
    
    return valid;
  }
  
  /**
   * Get the type of a value for validation.
   */
  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
  
  /**
   * Detect if JSON might be compressed (simple heuristic).
   */
  private detectCompression(text: string): boolean {
    // Simple heuristics for compression detection
    const hasMinification = !text.includes('\n') && !text.includes('  ');
    const hasShortKeys = /\"[a-z]{1,2}\":/g.test(text);
    const compressionRatio = text.length / (text.match(/[{}[\],:]/g) || []).length;
    
    return hasMinification && (hasShortKeys || compressionRatio < 10);
  }
  
  /**
   * Generate metadata about JSON structure.
   */
  private generateMetadata(data: any): { keys: number; depth: number; type: string } {
    return {
      keys: this.countKeys(data),
      depth: this.calculateDepth(data),
      type: this.getValueType(data)
    };
  }
  
  /**
   * Count total number of keys in object structure.
   */
  private countKeys(obj: any): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0;
    }
    
    let count = 0;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        count += this.countKeys(item);
      });
    } else {
      count = Object.keys(obj).length;
      Object.values(obj).forEach(value => {
        count += this.countKeys(value);
      });
    }
    
    return count;
  }
  
  /**
   * Calculate maximum depth of nested structure.
   */
  private calculateDepth(obj: any, currentDepth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        maxDepth = Math.max(maxDepth, this.calculateDepth(item, currentDepth + 1));
      });
    } else {
      Object.values(obj).forEach(value => {
        maxDepth = Math.max(maxDepth, this.calculateDepth(value, currentDepth + 1));
      });
    }
    
    return maxDepth;
  }
  
  /**
   * Parse JSON with error recovery.
   */
  static parseWithRecovery(text: string): { data?: any; error?: string } {
    try {
      return { data: JSON.parse(text) };
    } catch (error) {
      // Try to fix common JSON issues
      try {
        const loader = new JSONLoader();
        const cleaned = loader.cleanJSON(text);
        return { data: JSON.parse(cleaned) };
      } catch (recoveryError) {
        return { error: (error as Error).message };
      }
    }
  }
  
  /**
   * Validate JSON schema itself.
   */
  static validateSchema(schema: JSONSchema): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Basic schema validation
    if (schema.type && !['object', 'array', 'string', 'number', 'boolean'].includes(schema.type)) {
      errors.push(`Invalid type: ${schema.type}`);
    }
    
    if (schema.minimum !== undefined && schema.maximum !== undefined) {
      if (schema.minimum > schema.maximum) {
        errors.push('Minimum value cannot be greater than maximum value');
      }
    }
    
    if (schema.minLength !== undefined && schema.maxLength !== undefined) {
      if (schema.minLength > schema.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length');
      }
    }
    
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}