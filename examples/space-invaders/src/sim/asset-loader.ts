import { AssetStore, createAssetStore } from './asset-store';

export type AssetLoader = {
    addSprite(name: string, src: string): AssetLoader;
    loadAssets(): Promise<AssetStore>;
};

export const createAssetLoader = (): AssetLoader => {
    const sprites: Record<string, HTMLImageElement> = {};
    const tasks: Promise<void>[] = [];

    const assetLoader = {
        addSprite: (name: string, src: string) => {
            tasks.push(
                new Promise<void>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        sprites[name] = image;
                        resolve();
                    };
                    image.onerror = () =>
                        reject(`Failed to load image ${src}. Please check path, filename and extension.`);
                    image.src = src;
                })
            );

            return assetLoader;
        },
        loadAssets: async () => {
            await Promise.all(tasks);

            return createAssetStore({ sprites });
        }
    };

    return assetLoader;
};
