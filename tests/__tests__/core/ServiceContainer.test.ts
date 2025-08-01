import { ServiceContainer } from '../../../src/core/ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('Basic Binding and Resolution', () => {
    it('should bind and resolve a simple value', () => {
      const testValue = 'test-value';
      container.bind('test', testValue);
      
      const resolved = container.make('test');
      expect(resolved).toBe(testValue);
    });

    it('should bind and resolve a factory function', () => {
      const factory = () => ({ created: true });
      container.bind('factory', factory);
      
      const resolved = container.make('factory');
      expect(resolved).toEqual({ created: true });
    });

    it('should handle singleton bindings', () => {
      let counter = 0;
      const factory = () => ({ id: ++counter });
      
      container.singleton('singleton', factory);
      
      const first = container.make('singleton');
      const second = container.make('singleton');
      
      expect(first).toBe(second);
      expect(first.id).toBe(1);
    });

    it('should bind non-singleton factory functions that create new instances', () => {
      let counter = 0;
      const factory = () => ({ id: ++counter });
      
      container.bind('non-singleton', factory, false);
      
      const first = container.make('non-singleton');
      const second = container.make('non-singleton');
      
      expect(first).not.toBe(second);
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('should handle rebinding of services', () => {
      container.bind('test', 'original-value');
      expect(container.make('test')).toBe('original-value');
      
      container.bind('test', 'new-value');
      expect(container.make('test')).toBe('new-value');
    });

    it('should clear instances when rebinding singletons', () => {
      let counter = 0;
      const factory1 = () => ({ id: ++counter, type: 'first' });
      const factory2 = () => ({ id: ++counter, type: 'second' });
      
      container.singleton('rebind-test', factory1);
      const first = container.make('rebind-test');
      expect(first.type).toBe('first');
      expect(first.id).toBe(1);
      
      // Rebind with new factory
      container.singleton('rebind-test', factory2);
      const second = container.make('rebind-test');
      expect(second.type).toBe('second');
      expect(second.id).toBe(2);
      expect(second).not.toBe(first);
    });
  });

  describe('Aliases', () => {
    it('should resolve aliases correctly', () => {
      const testValue = 'aliased-value';
      container.bind('original', testValue);
      container.alias('alias', 'original');
      
      const resolved = container.make('alias');
      expect(resolved).toBe(testValue);
    });

    it('should handle alias chains', () => {
      const testValue = { data: 'chained-alias' };
      container.bind('original', testValue);
      container.alias('first-alias', 'original');
      container.alias('second-alias', 'first-alias');
      
      const resolved = container.make('second-alias');
      expect(resolved).toBe(testValue);
    });

    it('should check bound status using aliases', () => {
      container.bind('original', 'value');
      container.alias('alias', 'original');
      
      expect(container.bound('alias')).toBe(true);
      expect(container.bound('original')).toBe(true);
    });

    it('should unbind services using aliases', () => {
      container.bind('original', 'value');
      container.alias('alias', 'original');
      
      container.unbind('alias');
      expect(container.bound('original')).toBe(false);
      expect(container.bound('alias')).toBe(false);
    });

    it('should handle singleton caching with aliases', () => {
      let counter = 0;
      const factory = () => ({ id: ++counter });
      
      container.singleton('original', factory);
      container.alias('alias', 'original');
      
      const first = container.make('original');
      const second = container.make('alias');
      
      expect(first).toBe(second);
      expect(first.id).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unbound services', () => {
      expect(() => container.make('nonexistent')).toThrow("No binding found for 'nonexistent'");
    });

    it('should throw error for unbound aliases', () => {
      container.alias('alias', 'nonexistent');
      expect(() => container.make('alias')).toThrow("No binding found for 'alias'");
    });

    it('should handle factory function errors gracefully', () => {
      const errorFactory = () => {
        throw new Error('Factory error');
      };
      
      container.bind('error-service', errorFactory);
      expect(() => container.make('error-service')).toThrow('Factory error');
    });
  });

  describe('Utility Methods', () => {
    it('should check if service is bound', () => {
      container.bind('test', 'value');
      
      expect(container.bound('test')).toBe(true);
      expect(container.bound('missing')).toBe(false);
    });

    it('should unbind services', () => {
      container.bind('test', 'value');
      expect(container.bound('test')).toBe(true);
      
      container.unbind('test');
      expect(container.bound('test')).toBe(false);
    });

    it('should unbind singleton instances', () => {
      let counter = 0;
      const factory = () => ({ id: ++counter });
      
      container.singleton('singleton-test', factory);
      const instance = container.make('singleton-test');
      expect(instance.id).toBe(1);
      
      container.unbind('singleton-test');
      expect(container.bound('singleton-test')).toBe(false);
    });

    it('should flush all bindings', () => {
      container.bind('test1', 'value1');
      container.bind('test2', 'value2');
      
      container.flush();
      
      expect(container.bound('test1')).toBe(false);
      expect(container.bound('test2')).toBe(false);
    });

    it('should flush all instances', () => {
      let counter = 0;
      const factory = () => ({ id: ++counter });
      
      container.singleton('singleton1', factory);
      container.singleton('singleton2', factory);
      
      // Create instances
      container.make('singleton1');
      container.make('singleton2');
      
      container.flush();
      
      expect(container.bound('singleton1')).toBe(false);
      expect(container.bound('singleton2')).toBe(false);
    });

    it('should flush all aliases', () => {
      container.bind('original', 'value');
      container.alias('alias1', 'original');
      container.alias('alias2', 'original');
      
      expect(container.bound('alias1')).toBe(true);
      expect(container.bound('alias2')).toBe(true);
      
      container.flush();
      
      expect(container.bound('alias1')).toBe(false);
      expect(container.bound('alias2')).toBe(false);
      expect(container.bound('original')).toBe(false);
    });

    describe('getBindings method', () => {
      it('should return a copy of all bindings', () => {
        container.bind('test1', 'value1');
        container.bind('test2', 'value2');
        
        const bindings = container.getBindings();
        
        expect(bindings.size).toBe(2);
        expect(bindings.has('test1')).toBe(true);
        expect(bindings.has('test2')).toBe(true);
        
        // Should be a copy, not the original
        bindings.delete('test1');
        expect(container.bound('test1')).toBe(true);
      });

      it('should return binding details', () => {
        const testValue = 'binding-value';
        container.bind('test', testValue);
        
        const bindings = container.getBindings();
        const binding = bindings.get('test');
        
        expect(binding).toBeDefined();
        expect(binding.concrete).toBe(testValue);
        expect(binding.singleton).toBe(false);
        expect(binding.instance).toBeUndefined();
      });

      it('should show singleton binding details', () => {
        const factory = () => ({ test: true });
        container.singleton('singleton-test', factory);
        
        const bindings = container.getBindings();
        const binding = bindings.get('singleton-test');
        
        expect(binding).toBeDefined();
        expect(binding.concrete).toBe(factory);
        expect(binding.singleton).toBe(true);
        expect(binding.instance).toBeUndefined();
      });
    });

    describe('instance method', () => {
      it('should register existing instance as singleton', () => {
        const existingInstance = { id: 'existing', data: 'test' };
        
        const result = container.instance('existing-service', existingInstance);
        
        expect(result).toBe(existingInstance);
        expect(container.make('existing-service')).toBe(existingInstance);
        expect(container.bound('existing-service')).toBe(true);
      });

      it('should cache instance immediately', () => {
        const existingInstance = { id: 'cached' };
        
        container.instance('cached-service', existingInstance);
        
        const first = container.make('cached-service');
        const second = container.make('cached-service');
        
        expect(first).toBe(existingInstance);
        expect(second).toBe(existingInstance);
        expect(first).toBe(second);
      });

      it('should override existing bindings', () => {
        container.bind('override-test', 'original-value');
        const newInstance = { type: 'override' };
        
        container.instance('override-test', newInstance);
        
        expect(container.make('override-test')).toBe(newInstance);
      });
    });

    describe('keys method', () => {
      it('should return all bound service keys', () => {
        container.bind('service1', 'value1');
        container.bind('service2', 'value2');
        container.singleton('singleton1', () => ({ test: true }));
        
        const keys = container.keys();
        
        expect(keys).toHaveLength(3);
        expect(keys).toContain('service1');
        expect(keys).toContain('service2');
        expect(keys).toContain('singleton1');
      });

      it('should return empty array when no bindings exist', () => {
        const keys = container.keys();
        expect(keys).toEqual([]);
      });

      it('should not include aliases in keys', () => {
        container.bind('original', 'value');
        container.alias('alias', 'original');
        
        const keys = container.keys();
        
        expect(keys).toHaveLength(1);
        expect(keys).toContain('original');
        expect(keys).not.toContain('alias');
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed binding types', () => {
      const simpleValue = 'simple';
      const factoryValue = () => ({ factory: true });
      let singletonCounter = 0;
      const singletonFactory = () => ({ id: ++singletonCounter });
      const instanceValue = { instance: true };
      
      container.bind('simple', simpleValue);
      container.bind('factory', factoryValue);
      container.singleton('singleton', singletonFactory);
      container.instance('instance', instanceValue);
      
      expect(container.make('simple')).toBe(simpleValue);
      expect(container.make('factory')).toEqual({ factory: true });
      expect(container.make('singleton')).toEqual({ id: 1 });
      expect(container.make('instance')).toBe(instanceValue);
      
      // Test singleton behavior
      expect(container.make('singleton')).toEqual({ id: 1 });
      
      // Test factory creates new instances
      expect(container.make('factory')).not.toBe(container.make('factory'));
    });

    it('should handle complex alias scenarios', () => {
      const service = { name: 'complex-service' };
      
      container.bind('original-service', service);
      container.alias('primary-alias', 'original-service');
      container.alias('secondary-alias', 'primary-alias');
      container.alias('tertiary-alias', 'secondary-alias');
      
      expect(container.make('tertiary-alias')).toBe(service);
      expect(container.bound('tertiary-alias')).toBe(true);
    });

    it('should maintain type safety with generics', () => {
      interface TestService {
        test(): string;
      }
      
      const testService: TestService = {
        test: () => 'type-safe'
      };
      
      container.bind<TestService>('typed-service', testService);
      
      const resolved = container.make<TestService>('typed-service');
      expect(resolved.test()).toBe('type-safe');
    });
  });

  describe('Circular Alias Detection', () => {
    it('should detect and prevent circular alias references', () => {
      container.bind('original', 'value');
      container.alias('alias1', 'alias2');
      container.alias('alias2', 'alias1');
      
      expect(() => container.make('alias1')).toThrow('Circular alias reference detected');
      expect(() => container.bound('alias1')).toThrow('Circular alias reference detected');
    });

    it('should detect complex circular references', () => {
      container.bind('original', 'value');
      container.alias('a', 'b');
      container.alias('b', 'c');
      container.alias('c', 'a');
      
      expect(() => container.make('a')).toThrow('Circular alias reference detected');
    });
  });
});