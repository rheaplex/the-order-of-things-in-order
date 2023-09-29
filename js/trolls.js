// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

import * as THREE from './three.module.min.js';
import mulberry32 from './mulberry32.js';

let rng;

const randomFloat = (low, high) => {
  const range = high - low;
  return low + (rng() * range);
};

const randomInt = (low, high) => {
  const range = (high - low) + 1;
  return Math.floor(randomFloat(low, high));
};

class Appearance {
  fill () {
    return {
      r: 1.0,
      g: 0.0,
      b: 0.0,
      a: 1.0
    };
  }

  stroke () {
    return false;
  }
}

/* Like That: 3d */

/* global THREE */

class Form {
  constructor(scene, appearance, behaviour) {
    this.scene = scene;
    this.behaviour = behaviour;
    // Are we active in the scene?
    this.active = false;
    const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const colour = appearance.fill();
    const materialProperties = {
      color: new THREE.Color(colour.r, colour.g, colour.b)
    };
    if (colour.a < 1.0) {
      materialProperties.transparent = true;
      materialProperties.opacity = colour.a;
    }
    const material = new THREE.MeshStandardMaterial(materialProperties);
    this.mesh = new THREE.Mesh(geometry, material);
  }

  setState(x, y, z, size) {
    // Lazily add ourselves to the scene to avoid appearing as a unit cube.
    // Setting size zero doesn't work.
    if (! this.active) {
      this.scene.add(this.mesh);
      this.active = true;
    }
    this.mesh.position.set(x, y, z);
    this.mesh.scale.set(size, size, size);
  }

  update(now) {
    this.behaviour.apply(this, now);
  }

  dispose() {
    this.active = false;
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

class Behaviour {
  constructor(
    xx, yy, zz, siz, start_grow, stop_grow, start_shrink, stop_shrink
  ) {
    this.x = xx;
    this.y = yy;
    this.z = zz;
    this.size = siz;
    this.start_growing = start_grow;
    this.stop_growing = stop_grow;
    this.start_shrinking = start_shrink;
    this.stop_shrinking = stop_shrink;
    this.grow_factor = 1.0 / (stop_grow - start_grow);
    this.shrink_factor = 1.0 / (stop_shrink - start_shrink);
  }

  scaleFactor(t) {
    let scale = 0.0;
    // If we are after the end of the animation, the scale is 0.0
    if (t < this.stop_shrinking) {
      // If we are shrinking
      if (t > this.start_shrinking) {
        scale = 1.0 - (this.shrink_factor * (t - this.start_shrinking));
      // If we are grown
      } else if (t > this.stop_growing) {
        scale = 1.0;
      // If we are growing
      } else if (t > this.start_growing) {
        scale = this.grow_factor * (t - this.start_growing); 
      }
      // Otherwise we are before the start of our animation, so scale is 0.0
    }
    return scale;
  }

  apply(form, t) {
    const scale_factor = this.scaleFactor(t); 
    if (scale_factor === 0) {
      return; 
    }
    const inverse_nonzero_scale_factor = 1.0 / (scale_factor + 0.00001);
    form.setState(
      this.x * inverse_nonzero_scale_factor,
      this.y * inverse_nonzero_scale_factor,
      this.z * inverse_nonzero_scale_factor,
      this.size * scale_factor
    );
  }

  finished(t) {
    return t > this.stop_shrinking;
  }
}

/* global Appearance Behaviour Form randomFloat randomInt */

export default class Sequence {
  constructor (scene, now, seed) {
    rng = mulberry32(seed);
    this.scene = scene;
    this.min_objects = 4;
    this.max_objects = 24;
    this.iterations = 0;
    // t == 0..1
    this.min_object_start_t = 0.0;
    this.max_object_start_t = 0.5;
     // In world units
    this.min_object_size = 0.05;
    this.max_object_size = 2.0;
    this.min_object_x = -this.max_object_size * 0.5;
    this.max_object_x = this.max_object_size * 0.5;
    this.min_object_y = -this.max_object_size * 0.5;
    this.max_object_y = this.max_object_size * 0.5;
    this.min_object_z = -this.max_object_size * 0.5;
    this.max_object_z = this.max_object_size * 0.5;
    // In seconds
    this.min_duration = 1.0;
    this.max_duration = 10.0;
    this.end_of_current_sequence = 0;
    // In radians
    this.rotation = 0;
    this.genObjects(now);
  }

  randomDuration () {
    return randomFloat(this.min_duration, this.max_duration) * 1000; 
  }

  genObjects (start_growing) {
    this.rotation = rng() * (Math.PI / 2.0);
    const num_objects = randomInt(this.max_objects, this.min_objects);
    this.forms = new Array(num_objects); 
    const growing_range = this.randomDuration();
    const stop_growing = start_growing + growing_range;
    const start_shrinking = stop_growing + this.randomDuration();
    const shrinking_range = this.randomDuration();
    const stop_shrinking = start_shrinking + shrinking_range;
    this.end_of_current_sequence = stop_shrinking;
    for (let i = 0; i < num_objects; i++) {
      const t_factor = randomFloat(
        this.min_object_start_t,
        this.max_object_start_t
      );
      this.forms[i] = new Form(
        this.scene,
        new Appearance(),
        new Behaviour(
             randomFloat(this.min_object_x, this.max_object_x),
             randomFloat(this.min_object_y, this.max_object_y), 
             randomFloat(this.min_object_z, this.max_object_z), 
             randomFloat(this.min_object_size, this.max_object_size), 
          start_growing + (growing_range * t_factor),
          stop_growing,
          start_shrinking,
          start_shrinking + (shrinking_range * t_factor)
        )
      );
    }
  }

  disposeObjects () {
    // Every item should have been disposed of, but just in case...
    if (this.forms.length > 0) {
      console.log("Forms list not empty after animation finished.");
      this.forms.forEach(form => form.dispose());
    }
    delete this.forms;
  }

  updateObjects (now) {
    if (now >= this.end_of_current_sequence) {
      this.iterations += 1;
      this.disposeObjects();
      this.genObjects(now);
    }
    this.forms.forEach((form, index) => {
      if (!form.behaviour.finished(now)) {
        form.update(now);
      } else {
        // Rather than set size to zero and waste resources continue to
        // update/render unseen objects (and upset three.js), dispose of
        // finished items and remove them from the forms list.
        form.dispose();
        this.forms.splice(index, 1);
      }
    });
  }
}

// @license-end
