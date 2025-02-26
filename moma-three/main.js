import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GUI } from "lil-gui";

let scene, camera, renderer;
let controls, transformControl;
let boxMesh;
const handles = {};
// Initial box dimensions
const boxParams = { width: 200, height: 200, depth: 200 };

init();
animate();

function init() {
  // Create scene and camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(400, 400, 400);
  scene.add(camera);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(1, 1, 1);
  scene.add(directional);

  // Create the editable box
  updateBoxGeometry();

  // Create handles for each face
  createHandles();

  // Orbit controls for camera interaction
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // TransformControls for dragging handles
  transformControl = new TransformControls(camera, renderer.domElement);
  transformControl.addEventListener("objectChange", updateBoxFromHandle);
  scene.add(transformControl);

  // Raycaster-based picking for handles
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", onWindowResize);

  // (Optional) GUI for monitoring parameters
  const gui = new GUI();
  gui.add(boxParams, "width", 10, 500).listen();
  gui.add(boxParams, "height", 10, 500).listen();
  gui.add(boxParams, "depth", 10, 500).listen();
}

function updateBoxGeometry() {
  // Remove and dispose the old geometry if it exists
  if (boxMesh) {
    scene.remove(boxMesh);
    boxMesh.geometry.dispose();
  }
  const geometry = new THREE.BoxGeometry(
    boxParams.width,
    boxParams.height,
    boxParams.depth
  );
  const material = new THREE.MeshLambertMaterial({
    color: 0x808080,
    wireframe: false,
  });
  boxMesh = new THREE.Mesh(geometry, material);
  scene.add(boxMesh);
}

function createHandles() {
  // Remove old handles if they exist
  for (let key in handles) {
    scene.remove(handles[key]);
  }
  // Create new handles for each face.
  // We use a small cube as a handle.
  const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const handleGeom = new THREE.BoxGeometry(10, 10, 10);

  // Right face (positive X)
  const right = new THREE.Mesh(handleGeom, handleMaterial);
  right.position.set(boxParams.width / 2, 0, 0);
  handles.right = right;
  scene.add(right);

  // Left face (negative X)
  const left = new THREE.Mesh(handleGeom, handleMaterial);
  left.position.set(-boxParams.width / 2, 0, 0);
  handles.left = left;
  scene.add(left);

  // Top face (positive Y)
  const top = new THREE.Mesh(handleGeom, handleMaterial);
  top.position.set(0, boxParams.height / 2, 0);
  handles.top = top;
  scene.add(top);

  // Bottom face (negative Y)
  const bottom = new THREE.Mesh(handleGeom, handleMaterial);
  bottom.position.set(0, -boxParams.height / 2, 0);
  handles.bottom = bottom;
  scene.add(bottom);

  // Front face (positive Z)
  const front = new THREE.Mesh(handleGeom, handleMaterial);
  front.position.set(0, 0, boxParams.depth / 2);
  handles.front = front;
  scene.add(front);

  // Back face (negative Z)
  const back = new THREE.Mesh(handleGeom, handleMaterial);
  back.position.set(0, 0, -boxParams.depth / 2);
  handles.back = back;
  scene.add(back);
}

function onPointerDown(event) {
  // Use raycaster to check if a handle was clicked
  const pointer = new THREE.Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersected = raycaster.intersectObjects(Object.values(handles));
  if (intersected.length > 0) {
    // Attach the transform control to the first handle hit
    transformControl.attach(intersected[0].object);
  } else {
    transformControl.detach();
  }
}

function updateBoxFromHandle() {
  if (!transformControl.object) return;
  const handle = transformControl.object;
  // Determine which face is being modified by checking against our handles
  for (let key in handles) {
    if (handles[key] === handle) {
      // Based on the face, update the corresponding dimension.
      // We assume the box is centered at the origin so that the face position is half the dimension.
      switch (key) {
        case "right":
          boxParams.width = Math.max(10, handle.position.x * 2);
          break;
        case "left":
          boxParams.width = Math.max(10, -handle.position.x * 2);
          break;
        case "top":
          boxParams.height = Math.max(10, handle.position.y * 2);
          break;
        case "bottom":
          boxParams.height = Math.max(10, -handle.position.y * 2);
          break;
        case "front":
          boxParams.depth = Math.max(10, handle.position.z * 2);
          break;
        case "back":
          boxParams.depth = Math.max(10, -handle.position.z * 2);
          break;
      }
      // Rebuild the box geometry and reposition the handles
      updateBoxGeometry();
      createHandles();
      // Reattach the transform control to the moved handle (the new handle is recreated)
      transformControl.attach(handles[key]);
      break;
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
