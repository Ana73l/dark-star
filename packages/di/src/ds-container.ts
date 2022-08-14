import { InjectableIdentifier, InjectableData, Container } from './types';
import { ScopeType } from './scopeType';
import { RegistrationType } from './registration-type';

/**
 * @hidden
 * Implementation of the {@link Container} interface
 */
export class DSContainer implements Container {
	private readonly singletons = new Map<InjectableIdentifier<unknown>, unknown>();

	public constructor(
		private readonly injectables: ReadonlyMap<InjectableIdentifier<unknown>, InjectableData<unknown>>
	) {}

	public get<T>(identifier: InjectableIdentifier<T>): T {
		return this.getInjectable(identifier);
	}

	private getInjectable<T>(identifier: InjectableIdentifier<T>): T {
		const data = this.findInjectableDataOrThrow(identifier);

		// if scope is singleton and is already registered
		if (data.scope === ScopeType.Singleton && this.singletons.has(identifier)) {
			return this.singletons.get(identifier) as T;
		}

		let instance: T;

		if (data.type === RegistrationType.Instance) {
			instance = data.instance as T;
		} else if (data.type === RegistrationType.Class) {
			const dependencies = this.getDependencies(data.dependencies);

			instance = new data.class(...dependencies);
		} else {
			instance = data.factory() as T;
		}

		// register
		if (data.scope === ScopeType.Singleton) {
			this.singletons.set(identifier, instance);
		}

		return instance;
	}

	private findInjectableDataOrThrow<T>(identifier: InjectableIdentifier<T>): InjectableData<T> {
		const injectable = this.injectables.get(identifier);

		if (!injectable) {
			throw new Error();
		}

		const data = injectable as InjectableData<T>;

		return data;
	}

	private getDependencies(identifiers: InjectableIdentifier<unknown>[]) {
		const dependencies: unknown[] = [];

		identifiers.forEach((identifier) => {
			dependencies.push(this.getInjectable(identifier));
		});

		return dependencies;
	}
}
