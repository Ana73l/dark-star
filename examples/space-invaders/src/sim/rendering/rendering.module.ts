import { Module } from '@dark-star/ecs';

import { ClearContextSystem } from './clear-context.system';
import { RenderSpritesSystem } from './render-sprites.system';

const renderingModule: Module = {
    systems: [ClearContextSystem, RenderSpritesSystem]
};

export default renderingModule;
