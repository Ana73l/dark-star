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
const react_1 = require("react");
require("./App.css");
const bootstrap_1 = require("./sim/bootstrap");
const App = () => {
    const canvas = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const resize = () => {
            if (!canvas.current) {
                return;
            }
            (() => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, bootstrap_1.bootstrap)(canvas.current);
            }))();
            canvas.current.width = window.innerWidth;
            canvas.current.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [canvas]);
    return <canvas ref={canvas}/>;
};
exports.default = App;
//# sourceMappingURL=App.js.map