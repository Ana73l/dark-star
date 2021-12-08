"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssetLoader = void 0;
const asset_store_1 = require("./asset-store");
const createAssetLoader = () => {
    const sprites = {};
    const tasks = [];
    const assetLoader = {
        addSprite: (name, src) => {
            tasks.push(new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    sprites[name] = image;
                    resolve();
                };
                image.src = src;
            }));
            return assetLoader;
        },
        loadAssets: () => __awaiter(void 0, void 0, void 0, function* () {
            yield Promise.all(tasks);
            return (0, asset_store_1.createAssetStore)({ sprites });
        })
    };
    return assetLoader;
};
exports.createAssetLoader = createAssetLoader;
//# sourceMappingURL=asset-loader.js.map