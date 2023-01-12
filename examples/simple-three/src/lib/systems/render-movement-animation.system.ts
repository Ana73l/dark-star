import { System, group, SystemQuery, read, entities, updateBefore } from '@dark-star/ecs';
import { injectable } from '@dark-star/di';
import { LoopOnce } from 'three';

import { ThreeObject } from '../components/three-object.data';

import { RenderGroup } from './render-group.system';
import { MovementAnimation } from '../components/movement-animation.data';
import { RenderThreeScene } from './render-three-scene.system';
import { DeltaTime } from '../providers/delta-time.provider';

@injectable()
@group(RenderGroup)
@updateBefore(RenderThreeScene)
export class RenderMovementAnimation extends System {
	@entities([ThreeObject, MovementAnimation])
	public movables!: SystemQuery<[typeof ThreeObject, typeof MovementAnimation]>;

	constructor(private threeSceneSystem: RenderThreeScene, private deltaT: DeltaTime) {
		super();
	}

	public override async update() {
		const deltaT = this.deltaT.value;
		const entityToThreeObj = this.threeSceneSystem.entityToThreeObj;

		await this.movables
			.each([read(ThreeObject), read(MovementAnimation)], ([threeObj, animation]) => {
				const obj = entityToThreeObj.get(threeObj.entity)!;
				const animationsMixer = obj.animationsMixer!;
				const animations = obj.animations!;
				const currentAnimation = animation.current;
				const previousAnimation = animation.previous;
				const currentAction = animations[currentAnimation].action;

				if (currentAnimation !== previousAnimation) {
					if (previousAnimation) {
						const previousAction = animations[previousAnimation].action;

						currentAction.reset();
						currentAction.clampWhenFinished = true;
						currentAction.crossFadeFrom(previousAction, 0.5, true);
						currentAction.setEffectiveTimeScale(1.0);
						currentAction.setEffectiveWeight(1.0);
						currentAction.play();
					} else {
						currentAction.play();
					}
				} else {
					currentAction.play();
				}

				animationsMixer.update(deltaT * 0.001);
			})
			.run();
	}
}
