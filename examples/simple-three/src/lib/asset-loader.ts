import { AnimationClip } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
0;
import { AssetStore, createAssetStore, Model3DParam } from './asset-store';

export type AssetLoader = {
	addObject(name: string, src: string): AssetLoader;
	addObjectGLTF(name: string, src: string): AssetLoader;
	addSprite(name: string, src: string): AssetLoader;
	addSound(name: string, src: string): AssetLoader;
	loadAssets(): Promise<AssetStore>;
};

export const createAssetLoader = (): AssetLoader => {
	const objects: Record<string, Model3DParam> = {};
	const sprites: Record<string, HTMLImageElement> = {};
	const sounds: Record<string, HTMLAudioElement> = {};
	const tasks: Promise<void>[] = [];
	const fbx = new FBXLoader();
	const gltf = new GLTFLoader();

	const assetLoader = {
		addObject: (name: string, src: string) => {
			tasks.push(
				new Promise<void>((resolve, reject) => {
					fbx.load(
						src,
						(object) => {
							object.traverse((o) => {
								o.frustumCulled = false;
								o.castShadow = true;
								o.receiveShadow = true;
							});

							const animations: Record<string, AnimationClip> = {};

							object.animations.forEach((clip) => (animations[clip.name] = clip));

							objects[name] = {
								object,
								animations
							};

							resolve();
						},
						undefined,
						(err) => reject(err)
					);
				})
			);

			return assetLoader;
		},
		addObjectGLTF: (name: string, src: string) => {
			tasks.push(
				new Promise<void>((resolve, reject) => {
					gltf.load(
						src,
						(gltf) => {
							gltf.scene.traverse((o) => {
								o.frustumCulled = false;
								o.castShadow = true;
								o.receiveShadow = true;
							});

							const animations: Record<string, AnimationClip> = {};

							gltf.animations.forEach((clip) => (animations[clip.name] = clip));

							objects[name] = {
								object: gltf.scene,
								animations
							};

							console.log(name, objects[name]);
							resolve();
						},
						undefined,
						(err) => reject(err)
					);
				})
			);

			return assetLoader;
		},
		addSprite: (name: string, src: string) => {
			tasks.push(
				new Promise<void>((resolve, reject) => {
					const image = new Image();
					image.onload = () => {
						sprites[name] = image;
						resolve();
					};
					image.onerror = () => reject(`Failed to load image ${src}. Please check path, filename and extension.`);
					image.src = src;
				})
			);

			return assetLoader;
		},
		addSound: (name: string, src: string) => {
			tasks.push(
				new Promise<void>((resolve, reject) => {
					const sound = new Audio(src);
					sound.autoplay = false;
					sound.addEventListener('canplay', () => {
						sounds[name] = sound;
						resolve();
					});
					sound.onerror = () => reject(`Failed to load sound ${src}: Please check path, filename and extension.`);
				})
			);

			return assetLoader;
		},
		loadAssets: async () => {
			await Promise.all(tasks);

			return createAssetStore({ objects, sprites, sounds });
		}
	};

	return assetLoader;
};
