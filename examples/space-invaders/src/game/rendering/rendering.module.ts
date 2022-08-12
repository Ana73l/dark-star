import { Module } from '@dark-star/ecs';

import { ClearContextSystem } from './clear-context.system';
import { RenderBackgroundSystem } from './render-background.system';
import { RenderSpritesSystem } from './render-sprites.system';
import { RenderDamageSystem } from './render-damage.system';

const renderingModule: Module = {
    systems: [ClearContextSystem, RenderBackgroundSystem, RenderSpritesSystem, RenderDamageSystem]
};

export default renderingModule;
