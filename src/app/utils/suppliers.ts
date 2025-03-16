export function lazyAsyncSupplier<T>(factoryFn: () => Promise<T>): () => Promise<T>;
export function lazyAsyncSupplier<R, T>(factoryFn: (arg: R) => Promise<T>): (arg: R) => Promise<T>;
export function lazyAsyncSupplier<R, T>(
  factoryFn: ((arg: R) => Promise<T>) | (() => Promise<T>)
): ((arg: R) => Promise<T>) | (() => Promise<T>) {
  let promise: Promise<T> | null = null;

  // Оборачиваем обе версии в универсальную типобезопасную обёртку
  return ((...args: [R?]) => {
    if (!promise) {
      promise = (factoryFn as (arg: R | undefined) => Promise<T>)(...args);
    }
    return promise;
  }) as unknown as ((arg: R) => Promise<T>) | (() => Promise<T>);
}