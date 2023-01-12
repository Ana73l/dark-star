import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils';

export type Model3D = {
	object: Object3D;
	animationsMixer?: AnimationMixer;
	animations?: Record<string, { clip: AnimationClip; action: AnimationAction }>;
};

export type Model3DParam = {
	object: Object3D;
	animations?: Record<string, AnimationClip>;
};

export type Assets = {
	objects?: Record<string, Model3DParam>;
	sprites?: Record<string, HTMLImageElement>;
	sounds?: Record<string, HTMLAudioElement>;
};

export abstract class AssetStore {
	public abstract getObject(name: string): Model3D;
	public abstract getSprite(name: string): HTMLImageElement;
	public abstract getSound(name: string): HTMLAudioElement;
}

export const createAssetStore = ({ objects = {}, sprites = {}, sounds = {} }: Assets): AssetStore => {
	const assetStore = {
		getObject: (name: string): Model3D => {
			const template = objects[name];

			const object = clone(template.object);
			const templateAnimations = template.animations;

			let animationsMixer: AnimationMixer | undefined;
			let animations: Record<string, { clip: AnimationClip; action: AnimationAction }> | undefined;

			if (templateAnimations) {
				animationsMixer = new AnimationMixer(object);
				animations = {};

				for (const name in templateAnimations) {
					const clip = templateAnimations[name].clone();

					animations[name] = {
						clip: clip,
						action: animationsMixer.clipAction(clip)
					};
				}
			}

			return {
				object,
				animationsMixer,
				animations
			};
		},
		getSprite: (name: string): HTMLImageElement => sprites[name],
		getSound: (name: string): HTMLAudioElement => sounds[name].cloneNode(true) as HTMLAudioElement
	};

	return assetStore;
};
