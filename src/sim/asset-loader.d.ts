import { AssetStore } from './asset-store';
export declare type AssetLoader = {
    addSprite(name: string, src: string): AssetLoader;
    loadAssets(): Promise<AssetStore>;
};
export declare const createAssetLoader: () => AssetLoader;
//# sourceMappingURL=asset-loader.d.ts.map