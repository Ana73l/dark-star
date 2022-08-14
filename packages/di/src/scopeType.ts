/**
 * @hidden
 * Scope type. Indicates whether injectables should be injected as singletons in the container or inject a new instance in each dependee
 */
export enum ScopeType {
	Transient,
	Singleton,
}
