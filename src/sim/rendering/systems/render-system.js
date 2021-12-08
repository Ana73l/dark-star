"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderSystem = void 0;
const ecs_1 = require("@dark-star/ecs");
const shape_1 = require("../components/shape");
const position_1 = require("../../components/position");
let RenderSystem = class RenderSystem extends ecs_1.System {
    constructor(world, context) {
        super();
        this.context = context;
        this.entities = world.query([position_1.Position, shape_1.Shape]);
    }
    execute(deltaT) {
        const context = this.context;
        const canvas = this.context.canvas;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const [entities, [positions, shapes]] of this.entities) {
            const count = entities.length;
            let i;
            for (i = 0; i < count; i++) {
                if (shapes[i].shape === shape_1.Shapes.Circle) {
                    context.fillStyle = 'red';
                    context.beginPath();
                    context.arc(positions[i].x, positions[i].y, shapes[i].radius, 0, Math.PI);
                    context.fill();
                    context.closePath();
                    context.stroke();
                }
            }
        }
    }
};
RenderSystem = __decorate([
    ecs_1.system,
    __metadata("design:paramtypes", [typeof (_a = typeof ecs_1.World !== "undefined" && ecs_1.World) === "function" ? _a : Object, CanvasRenderingContext2D])
], RenderSystem);
exports.RenderSystem = RenderSystem;
//# sourceMappingURL=render-system.js.map