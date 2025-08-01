/**
 * @jest-environment jsdom
 */

import { Facade } from '../../../src/facades/Facade';
import { GameByte } from '../../../src/core/GameByte';

// Test facade implementation
class TestFacade extends Facade {
  protected static getFacadeAccessor(): string {
    return 'test-service';
  }

  static testMethod(arg: string): string {
    return this.callStatic('testMethod', [arg]);
  }

  static get testProperty(): any {
    return this.callStatic('getProperty', []);
  }
}

// Test service for facade
class TestService {
  testMethod(arg: string): string {
    return `processed: ${arg}`;
  }

  getProperty(): string {
    return 'test-property-value';
  }

  throwingMethod(): void {
    throw new Error('Service method error');
  }
}

// Facade without getFacadeAccessor implementation
class IncompleteFacade extends Facade {
  // Missing getFacadeAccessor implementation
}

// Facade that calls non-existent method
class BadMethodFacade extends Facade {
  protected static getFacadeAccessor(): string {
    return 'test-service';
  }

  static badMethod(): any {
    return this.callStatic('nonExistentMethod', []);
  }
}

describe('Facade', () => {
  let app: GameByte;
  let testService: TestService;

  beforeEach(() => {
    app = GameByte.create();
    testService = new TestService();
    app.bind('test-service', testService);
  });

  afterEach(() => {
    app.destroy();
    // Reset facade application
    (Facade as any).app = null;
  });

  describe('application management', () => {
    it('should set and get application instance', () => {
      // Act
      Facade.setApplication(app);
      const retrievedApp = Facade.getApplication();

      // Assert
      expect(retrievedApp).toBe(app);
    });

    it('should throw error when application is not set', () => {
      // Act & Assert
      expect(() => Facade.getApplication()).toThrow(
        'GameByte application not set on facade'
      );
    });

    it('should update application when set multiple times', () => {
      // Arrange
      const app1 = GameByte.create();
      const app2 = GameByte.create();

      // Act
      Facade.setApplication(app1);
      expect(Facade.getApplication()).toBe(app1);

      Facade.setApplication(app2);
      expect(Facade.getApplication()).toBe(app2);

      // Cleanup
      app1.destroy();
      app2.destroy();
    });
  });

  describe('facade accessor', () => {
    it('should throw error when getFacadeAccessor is not implemented', () => {
      // Act & Assert
      expect(() => (IncompleteFacade as any).getFacadeAccessor()).toThrow(
        'Facade must implement getFacadeAccessor method'
      );
    });

    it('should return correct facade accessor', () => {
      // Act
      const accessor = (TestFacade as any).getFacadeAccessor();

      // Assert
      expect(accessor).toBe('test-service');
    });
  });

  describe('service resolution', () => {
    beforeEach(() => {
      Facade.setApplication(app);
    });

    it('should resolve facade instance correctly', () => {
      // Act
      const instance = (TestFacade as any).resolveFacadeInstance();

      // Assert
      expect(instance).toBe(testService);
    });

    it('should throw error when service is not bound', () => {
      // Arrange
      class UnboundFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'unbound-service';
        }
      }

      // Act & Assert
      expect(() => (UnboundFacade as any).resolveFacadeInstance()).toThrow(
        "Service 'unbound-service' not found in container"
      );
    });

    it('should throw error when application is not set during resolution', () => {
      // Arrange
      (Facade as any).app = null;

      // Act & Assert
      expect(() => (TestFacade as any).resolveFacadeInstance()).toThrow(
        'GameByte application not set on facade'
      );
    });
  });

  describe('static method calls', () => {
    beforeEach(() => {
      Facade.setApplication(app);
    });

    it('should forward method calls to service instance', () => {
      // Act
      const result = TestFacade.testMethod('hello');

      // Assert
      expect(result).toBe('processed: hello');
    });

    it('should forward property access to service instance', () => {
      // Act
      const property = TestFacade.testProperty;

      // Assert
      expect(property).toBe('test-property-value');
    });

    it('should throw error when calling non-existent method', () => {
      // Act & Assert
      expect(() => BadMethodFacade.badMethod()).toThrow(
        "Method 'nonExistentMethod' does not exist on facade root"
      );
    });

    it('should pass through method arguments correctly', () => {
      // Arrange
      const spy = jest.spyOn(testService, 'testMethod');

      // Act
      TestFacade.testMethod('test-arg');

      // Assert
      expect(spy).toHaveBeenCalledWith('test-arg');
      spy.mockRestore();
    });

    it('should handle methods with multiple arguments', () => {
      // Arrange
      class MultiArgService {
        multiMethod(a: string, b: number, c: boolean): string {
          return `${a}-${b}-${c}`;
        }
      }

      class MultiArgFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'multi-service';
        }

        static multiMethod(a: string, b: number, c: boolean): string {
          return this.callStatic('multiMethod', [a, b, c]);
        }
      }

      app.bind('multi-service', new MultiArgService());

      // Act
      const result = MultiArgFacade.multiMethod('hello', 42, true);

      // Assert
      expect(result).toBe('hello-42-true');
    });

    it('should handle method errors from service', () => {
      // Arrange
      class ErrorFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'test-service';
        }

        static throwingMethod(): void {
          return this.callStatic('throwingMethod', []);
        }
      }

      // Act & Assert
      expect(() => ErrorFacade.throwingMethod()).toThrow('Service method error');
    });
  });

  describe('facade inheritance', () => {
    it('should support multiple facade implementations', () => {
      // Arrange
      class AnotherTestService {
        anotherMethod(): string {
          return 'another-result';
        }
      }

      class AnotherTestFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'another-service';
        }

        static anotherMethod(): string {
          return this.callStatic('anotherMethod', []);
        }
      }

      app.bind('another-service', new AnotherTestService());
      Facade.setApplication(app);

      // Act
      const result1 = TestFacade.testMethod('test');
      const result2 = AnotherTestFacade.anotherMethod();

      // Assert
      expect(result1).toBe('processed: test');
      expect(result2).toBe('another-result');
    });

    it('should maintain separate facade state', () => {
      // Arrange
      class Service1 {
        getValue(): string { return 'service1'; }
      }

      class Service2 {
        getValue(): string { return 'service2'; }
      }

      class Facade1 extends Facade {
        protected static getFacadeAccessor(): string { return 'service1'; }
        static getValue(): string { return this.callStatic('getValue', []); }
      }

      class Facade2 extends Facade {
        protected static getFacadeAccessor(): string { return 'service2'; }
        static getValue(): string { return this.callStatic('getValue', []); }
      }

      app.bind('service1', new Service1());
      app.bind('service2', new Service2());
      Facade.setApplication(app);

      // Act
      const value1 = Facade1.getValue();
      const value2 = Facade2.getValue();

      // Assert
      expect(value1).toBe('service1');
      expect(value2).toBe('service2');
    });
  });

  describe('error scenarios', () => {
    beforeEach(() => {
      Facade.setApplication(app);
    });

    it('should handle service resolution when container is empty', () => {
      // Arrange
      const emptyApp = GameByte.create();
      Facade.setApplication(emptyApp);

      // Act & Assert
      expect(() => (TestFacade as any).resolveFacadeInstance()).toThrow(
        "Service 'test-service' not found in container"
      );

      emptyApp.destroy();
    });

    it('should handle null service binding', () => {
      // Arrange
      app.bind('null-service', null);

      class NullFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'null-service';
        }

        static callNull(): any {
          return this.callStatic('someMethod', []);
        }
      }

      // Act & Assert
      expect(() => NullFacade.callNull()).toThrow(
        "Facade root instance is null"
      );
    });

    it('should handle undefined service binding', () => {
      // Arrange
      app.bind('undefined-service', undefined);

      class UndefinedFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'undefined-service';
        }

        static callUndefined(): any {
          return this.callStatic('someMethod', []);
        }
      }

      // Act & Assert
      expect(() => UndefinedFacade.callUndefined()).toThrow(
        "Facade root instance is undefined"
      );
    });
  });

  describe('resolve method', () => {
    beforeEach(() => {
      Facade.setApplication(app);
    });

    it('should resolve service using default facade accessor', () => {
      // Act
      const resolvedService = (TestFacade as any).resolve();

      // Assert
      expect(resolvedService).toBe(testService);
    });

    it('should resolve service using custom key', () => {
      // Arrange
      const customService = { customMethod: () => 'custom' };
      app.bind('custom-service', customService);

      // Act
      const resolvedService = (TestFacade as any).resolve('custom-service');

      // Assert
      expect(resolvedService).toBe(customService);
    });

    it('should throw error when application is not set', () => {
      // Arrange
      (Facade as any).app = null;

      // Act & Assert
      expect(() => (TestFacade as any).resolve()).toThrow(
        'GameByte application not set on facade'
      );
    });
  });

  describe('async method support', () => {
    beforeEach(() => {
      Facade.setApplication(app);
    });

    it('should support async methods', async () => {
      // Arrange
      class AsyncService {
        async asyncMethod(value: string): Promise<string> {
          return new Promise(resolve => {
            setTimeout(() => resolve(`async: ${value}`), 10);
          });
        }
      }

      class AsyncFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'async-service';
        }

        static async asyncMethod(value: string): Promise<string> {
          return this.callStatic('asyncMethod', [value]);
        }
      }

      app.bind('async-service', new AsyncService());

      // Act
      const result = await AsyncFacade.asyncMethod('test');

      // Assert
      expect(result).toBe('async: test');
    });

    it('should handle async method errors', async () => {
      // Arrange
      class FailingAsyncService {
        async failingMethod(): Promise<string> {
          throw new Error('Async method failed');
        }
      }

      class FailingAsyncFacade extends Facade {
        protected static getFacadeAccessor(): string {
          return 'failing-async-service';
        }

        static async failingMethod(): Promise<string> {
          return this.callStatic('failingMethod', []);
        }
      }

      app.bind('failing-async-service', new FailingAsyncService());

      // Act & Assert
      await expect(FailingAsyncFacade.failingMethod()).rejects.toThrow('Async method failed');
    });
  });
});