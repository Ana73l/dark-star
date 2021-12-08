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
exports.bootstrap = void 0;
const asset_loader_1 = require("./asset-loader");
const asset_store_1 = require("./asset-store");
const render_system_1 = require("./rendering/systems/render-system");
const shape_1 = require("./rendering/components/shape");
const position_1 = require("./components/position");
const bootstrap = (canvas) => __awaiter(void 0, void 0, void 0, function* () {
    const assetStore = yield (0, asset_loader_1.createAssetLoader)().loadAssets();
    const world = yield new WorldBuilder()
        .registerSingleton(CanvasRenderingContext2D, canvas.getContext('2d'))
        .registerSingleton(asset_store_1.AssetStore, assetStore)
        .registerSystem(render_system_1.RenderSystem)
        .build();
    world.spawn([position_1.Position, shape_1.Shape], (entity, [position, shape]) => {
        shape.shape = shape_1.Shapes.Circle;
        shape.radius = 5;
    });
    return world;
});
exports.bootstrap = bootstrap;
//# sourceMappingURL=bootstrap.js.map