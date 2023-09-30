import * as THREE from './three.module.min.js';

import aesthetics from './aesthetics.js';
import allies from './allies.js';
import architecture from './architecture.js';
import citizens from './citizens.js';
import congress from './congress.js';
import dance from './dance.js';
import ghosts from './ghosts.js';
import market from './market.js';
import society from './society.js';
import subjects from './subjects.js';
import trolls from './trolls.js';
import xeno from './xeno.js';

const orders = [
  aesthetics,
  allies,
  architecture,
  citizens,
  congress,
  dance,
  ghosts,
  market,
  society,
  subjects,
  trolls,
  xeno,
];

// Two arrays antipattern

const orderNames = [
  'aesthetics',
  'allies',
  'architecture',
  'citizens',
  'congress',
  'dance',
  'ghosts',
  'market',
  'society',
  'subjects',
  'trolls',
  'xeno',
];

let camera;
let renderer;
let scene;

const setupThreeJs = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  camera = new THREE.PerspectiveCamera(
    50, // 75
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // translate (width / 2.0, height / 2.0, - (max (width, height) * 0.4));
  camera.position.z = 8.0;
  camera.position.x = -4.0;
  camera.position.y = 4.0;
  // Fudge to horizontally centre and almost vertically centre (low) cubes
  camera.lookAt(0.25, -0.25, 0.0);
  // ambientLight (245, 245, 245);
  const ambientLight = new THREE.AmbientLight(0xf5f5f5);
  scene.add(ambientLight);
  //directionalLight (50, 50, 50, 0, 1, -1);
  // Much brighter and slightly different angle for similar effect to P3D 
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);
  // For debugging.
  // The X axis is red. The Y axis is green. The Z axis is blue.
  /*var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);*/
  // Also debugging
  /*{
    const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const materialProperties = {
      color: new THREE.Color(1.0, 0.0, 0.0),
      transparent: true,
      opacity: 0.5
    };
    const material = new THREE.MeshStandardMaterial(materialProperties);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(4.0, 4.0, 4.0);
    //FIXME: move the camera instead.
    //mesh.rotateX(Math.PI / 8.0);
    //mesh.rotateY(Math.PI / 8.0);
    scene.add(mesh);
  }*/
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild( renderer.domElement );
};

const runSequence = async (sequence, seed, count) => {
  return new Promise(resolve => {
    function animate(now) {
      if (sequence.iterations < count) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
      sequence.updateObjects(now);
      renderer.render(scene, camera);
      const data = renderer.domElement.toDataURL();
      const filename = `${seed}-${count}-${window.frameNumber}`;
      
      window.frameNumber += 1;
    }
    requestAnimationFrame(animate);
  });
};

/* global performance */

export const ordersInOrder = (seed, count) => {
  console.log('Starting.');
  window.frameNumber = 0;
  setupThreeJs();
  return new Promise(async (resolve) => {
    for (let i = 0; i < orders.length; i++) {
      console.log(`Rendering: ${orderNames[i]}.`);
      const sequence = new orders[i](scene, performance.now(), seed);
      await runSequence(sequence, seed, count);
      console.log("---");
    }
    return "done";
  });
};
