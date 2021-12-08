export type Assets = {
    sprites?: Record<string, HTMLImageElement>;
};

export abstract class AssetStore {}

export const createAssetStore = ({ sprites = {} }: Assets): AssetStore => {
    const assetStore = {};
    return assetStore;
};
