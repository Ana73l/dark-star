"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shape = exports.Shapes = void 0;
const ecs_1 = require("@dark-star/ecs");
var Shapes;
(function (Shapes) {
    Shapes[Shapes["Circle"] = 0] = "Circle";
    Shapes[Shapes["Rectangle"] = 1] = "Rectangle";
})(Shapes = exports.Shapes || (exports.Shapes = {}));
let Shape = class Shape {
    constructor() {
        this.shape = Shapes.Rectangle;
        this.width = 5;
        this.height = 5;
        this.radius = 5;
    }
};
Shape = __decorate([
    ecs_1.component
], Shape);
exports.Shape = Shape;
//# sourceMappingURL=shape.js.map