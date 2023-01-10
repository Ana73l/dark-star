import { Object3D } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

export type Assets = {
	objects?: Record<string, Object3D>;
	sprites?: Record<string, HTMLImageElement>;
	sounds?: Record<string, HTMLAudioElement>;
};

export abstract class AssetStore {
	public abstract getObject(name: string): Object3D;
	public abstract getSprite(name: string): HTMLImageElement;
	public abstract getSound(name: string): HTMLAudioElement;
}

export const createAssetStore = ({ objects = {}, sprites = {}, sounds = {} }: Assets): AssetStore => {
	const assetStore = {
		getObject: (name: string): Object3D => clone(objects[name]),
		getSprite: (name: string): HTMLImageElement => sprites[name],
		getSound: (name: string): HTMLAudioElement => sounds[name].cloneNode(true) as HTMLAudioElement
	};
	return assetStore;
};
