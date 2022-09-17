export type Assets = {
	sprites?: Record<string, HTMLImageElement>;
	sounds?: Record<string, HTMLAudioElement>;
};

export abstract class AssetStore {
	public abstract getSprite(name: string): HTMLImageElement;
	public abstract getSound(name: string): HTMLAudioElement;
}

export const createAssetStore = ({ sprites = {}, sounds = {} }: Assets): AssetStore => {
	const assetStore = {
		getSprite: (name: string): HTMLImageElement => sprites[name],
		getSound: (name: string): HTMLAudioElement => sounds[name].cloneNode(true) as HTMLAudioElement,
	};
	return assetStore;
};
