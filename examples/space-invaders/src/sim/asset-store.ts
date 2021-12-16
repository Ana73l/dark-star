export type Assets = {
    sprites?: Record<string, HTMLImageElement>;
};

export abstract class AssetStore {
    public abstract getSprite(name: string): HTMLImageElement;
}

export const createAssetStore = ({ sprites = {} }: Assets): AssetStore => {
    const assetStore = {
        getSprite: (name: string): HTMLImageElement => sprites[name]
    };
    return assetStore;
};
