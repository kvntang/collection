import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GUI } from "lil-gui";

let scene, camera, renderer;
let controls, transformControl;
let boxMesh, innerBox;
const handles = {};
// Use width, height, and length (centered at the origin)
const boxParams = { width: 200, height: 200, length: 200 };

let widthLabel, heightLabel, lengthLabel;
const isometricSize = 400; // For the orthographic view

init();
animate();

///////////////////////////////////////////
// Functions
///////////////////////////////////////////
function init() {
  // --- Scene Setup ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // --- Isometric (Orthographic) Camera Setup ---
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera(
    -isometricSize * aspect,
    isometricSize * aspect,
    isometricSize,
    -isometricSize,
    1,
    2000
  );
  camera.position.set(400, 400, 400); // Equal distances along x, y, z
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // --- Lighting ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(1, 1, 1);
  scene.add(directional);

  // --- Create Main Box, Handles & Labels ---
  updateBoxGeometry();
  createHandles();
  createDimensionLabels();

  // --- Create Inner Box ---
  updateInnerBox();

  // --- Orbit Controls ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // --- Transform Controls ---
  transformControl = new TransformControls(camera, renderer.domElement);
  transformControl.addEventListener("objectChange", updateBoxFromHandle);
  transformControl.addEventListener("dragging-changed", (event) => {
    controls.enabled = !event.value;
  });
  scene.add(transformControl);
  scene.add(transformControl.getHelper());

  // --- Event Listeners ---
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", onWindowResize);

  // // --- GUI Sliders ---
  // const gui = new GUI();
  // gui
  //   .add(boxParams, "width", 10, 500)
  //   .name("Width")
  //   .listen()
  //   .onChange(() => {
  //     updateBoxGeometry();
  //     createHandles();
  //     updateDimensionLabels();
  //     updateInnerBox();
  //   });
  // gui
  //   .add(boxParams, "height", 10, 500)
  //   .name("Height")
  //   .listen()
  //   .onChange(() => {
  //     updateBoxGeometry();
  //     createHandles();
  //     updateDimensionLabels();
  //     updateInnerBox();
  //   });
  // gui
  //   .add(boxParams, "length", 10, 500)
  //   .name("Length")
  //   .listen()
  //   .onChange(() => {
  //     updateBoxGeometry();
  //     createHandles();
  //     updateDimensionLabels();
  //     updateInnerBox();
  //   });
}

function updateBoxGeometry() {
  if (boxMesh) {
    scene.remove(boxMesh);
    boxMesh.geometry.dispose();
    if (Array.isArray(boxMesh.material)) {
      boxMesh.material.forEach((mat) => mat.dispose());
    } else {
      boxMesh.material.dispose();
    }
  }

  const geometry = new THREE.BoxGeometry(
    boxParams.width,
    boxParams.height,
    boxParams.length
  );

  // Define the two colors/materials
  const lightBlue = new THREE.MeshLambertMaterial({
    color: 0x87cefa,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  });
  const darkBlue = new THREE.MeshLambertMaterial({
    color: 0x4fbdfd,
    side: THREE.DoubleSide,
  });

  // Order of faces: [right, left, top, bottom, front, back]
  // Using light blue for right, top, and front; dark blue for left, bottom, and back.
  const materials = [
    lightBlue, // right face
    lightBlue, // left face
    lightBlue, // top face
    lightBlue, // bottom face
    lightBlue, // front face
    lightBlue, // back face
  ];

  boxMesh = new THREE.Mesh(geometry, materials);

  // Optionally add edges for clarity.
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const lineSegments = new THREE.LineSegments(edges, lineMaterial);
  boxMesh.add(lineSegments);

  scene.add(boxMesh);
}

function createHandles() {
  // Remove existing handles
  for (const key in handles) {
    scene.remove(handles[key]);
  }
  const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xf3f6f4 });
  const handleGeom = new THREE.BoxGeometry(10, 10, 10);

  // Red cubes on each face (for box manipulation)
  // Right face (positive X)
  const right = new THREE.Mesh(handleGeom, handleMaterial);
  right.position.set(boxParams.width / 2, 0, 0);
  handles.right = right;
  scene.add(right);

  // // Left face (negative X)
  // const left = new THREE.Mesh(handleGeom, handleMaterial);
  // left.position.set(-boxParams.width / 2, 0, 0);
  // handles.left = left;
  // scene.add(left);

  // Top face (positive Y)
  const top = new THREE.Mesh(handleGeom, handleMaterial);
  top.position.set(0, boxParams.height / 2, 0);
  handles.top = top;
  scene.add(top);

  // // Bottom face (negative Y)
  // const bottom = new THREE.Mesh(handleGeom, handleMaterial);
  // bottom.position.set(0, -boxParams.height / 2, 0);
  // handles.bottom = bottom;
  // scene.add(bottom);

  // Front face (positive Z) – for length
  const front = new THREE.Mesh(handleGeom, handleMaterial);
  front.position.set(0, 0, boxParams.length / 2);
  handles.front = front;
  scene.add(front);

  // // Back face (negative Z)
  // const back = new THREE.Mesh(handleGeom, handleMaterial);
  // back.position.set(0, 0, -boxParams.length / 2);
  // handles.back = back;
  // scene.add(back);
}

/**
 * Create a text plane using a canvas texture.
 * The `align` parameter supports:
 *   "left"  – shifts geometry so the left edge is at the pivot,
 *   "right" – shifts geometry so the right edge is at the pivot,
 *   "top"   – shifts geometry so the top edge is at the pivot,
 *   "bottom"– shifts geometry so the bottom edge is at the pivot.
 */
function makeTextPlane(message, parameters, align) {
  parameters = parameters || {};
  const fontface = parameters.fontface || "Arial";
  const fontsize = parameters.fontsize || 48; // Bigger font size
  const borderThickness = parameters.borderThickness || 4;

  // Create a canvas and set its context
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = fontsize + "px " + fontface;
  const metrics = context.measureText(message);
  const textWidth = metrics.width;
  const textHeight = fontsize * 1.4;

  // Set canvas size (including border space)
  canvas.width = textWidth + borderThickness * 2;
  canvas.height = textHeight + borderThickness * 2;

  // Clear the canvas (transparent background)
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw text with the new canvas size
  context.font = fontsize + "px " + fontface;
  context.fillStyle = "rgba(0,0,0,0.2)";
  context.fillText(message, borderThickness, fontsize + borderThickness);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  // Scale factor to convert pixel size to world units
  const scaleFactor = 0.5; // Adjust as needed for your scene
  const planeWidth = canvas.width * scaleFactor;
  const planeHeight = canvas.height * scaleFactor;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

  // Shift the geometry so that the specified edge is at the pivot
  if (align === "left") {
    geometry.translate(planeWidth / 2, 0, 0);
  } else if (align === "right") {
    geometry.translate(-planeWidth / 2, 0, 0);
  } else if (align === "bottom") {
    geometry.translate(0, planeHeight / 2, 0);
  } else if (align === "top") {
    geometry.translate(0, -planeHeight / 2, 0);
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.planeWidth = planeWidth;
  mesh.userData.planeHeight = planeHeight;
  return mesh;
}

function createDimensionLabels() {
  // Create the labels once; they will be repositioned in updateDimensionLabels.
  widthLabel = makeTextPlane(
    "w: " + Math.round(boxParams.width),
    { fontsize: 48 },
    "top"
  );
  heightLabel = makeTextPlane(
    "h: " + Math.round(boxParams.height),
    { fontsize: 48 },
    "left"
  );
  lengthLabel = makeTextPlane(
    "l: " + Math.round(boxParams.length),
    { fontsize: 48 },
    "right"
  );
  scene.add(widthLabel);
  scene.add(heightLabel);
  scene.add(lengthLabel);
  updateDimensionLabels();
}

function updateDimensionLabels() {
  // Remove previous labels
  if (widthLabel) scene.remove(widthLabel);
  if (heightLabel) scene.remove(heightLabel);
  if (lengthLabel) scene.remove(lengthLabel);

  // Recreate labels with updated text
  widthLabel = makeTextPlane(
    "w: " + Math.round(boxParams.width),
    { fontsize: 48 },
    "top"
  );
  heightLabel = makeTextPlane(
    "h: " + Math.round(boxParams.height),
    { fontsize: 48 },
    "left"
  );
  lengthLabel = makeTextPlane(
    "l: " + Math.round(boxParams.length),
    { fontsize: 48 },
    "right"
  );

  const gap = 10; // Gap from the box edge

  // --- Map each label to the edge it relates to ---
  heightLabel.position.set(
    boxParams.width / 2 + gap + 20,
    -50,
    -boxParams.length / 2
  );
  heightLabel.rotation.set(0, 0, Math.PI / 2); // Rotate so its front now faces +X

  widthLabel.position.set(0, -boxParams.height / 2 - gap, boxParams.length / 2);
  widthLabel.rotation.set(0, 0, 0); // Faces +Z

  lengthLabel.position.set(
    boxParams.width / 2, // x : how close to the edge
    -boxParams.height / 2 - gap - 15, // y: height
    -50 // z: trying to align it to center
  );
  lengthLabel.rotation.set(0, Math.PI / 2, 0);

  scene.add(widthLabel);
  scene.add(heightLabel);
  scene.add(lengthLabel);
}
function updateInnerBox() {
  // Remove the existing inner box if it exists
  if (innerBox) {
    scene.remove(innerBox);
    innerBox.geometry.dispose();
    if (Array.isArray(innerBox.material)) {
      innerBox.material.forEach((mat) => mat.dispose());
    } else {
      innerBox.material.dispose();
    }
  }

  const innerPadding = 20; // Padding from the main box edges
  const innerWidth = boxParams.width - 2 * innerPadding;
  const innerHeight = boxParams.height - 2 * innerPadding;
  const innerDepth = 20; // Thicker inner box

  const innerGeometry = new THREE.BoxGeometry(
    innerWidth,
    innerHeight,
    innerDepth
  );

  // Load the image from the root folder
  const texture = new THREE.TextureLoader().load("image.jpg");

  // Create an array of 6 materials for the inner box.
  // Apply the image texture to both the front (index 4) and back (index 5) faces,
  // using MeshBasicMaterial to ensure full, unlit color.

  const brownColor = 0x000000;

  const innerMaterials = [
    new THREE.MeshBasicMaterial({ color: brownColor }), // right
    new THREE.MeshBasicMaterial({ color: brownColor }), // left
    new THREE.MeshBasicMaterial({ color: brownColor }), // top
    new THREE.MeshBasicMaterial({ color: brownColor }), // bottom
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), // front
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), // back
  ];

  innerBox = new THREE.Mesh(innerGeometry, innerMaterials);
  // Center the inner box within the main box
  innerBox.position.set(0, 0, 0);
  scene.add(innerBox);
}

function onPointerDown(event) {
  const pointer = new THREE.Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(Object.values(handles));

  if (intersects.length > 0) {
    let selectedKey = null;
    for (let key in handles) {
      if (handles[key] === intersects[0].object) {
        selectedKey = key;
        break;
      }
    }
    if (selectedKey) {
      transformControl.attach(handles[selectedKey]);
      updateGizmoForFace(selectedKey);
    }
  } else {
    transformControl.detach();
  }
}

function updateBoxFromHandle() {
  if (!transformControl.object) return;
  const handle = transformControl.object;
  for (let key in handles) {
    if (handles[key] === handle) {
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
          boxParams.length = Math.max(10, handle.position.z * 2);
          break;
        case "back":
          boxParams.length = Math.max(10, -handle.position.z * 2);
          break;
      }
      updateBoxGeometry();
      createHandles();
      updateDimensionLabels();
      updateInnerBox();
      transformControl.attach(handles[key]);
      updateGizmoForFace(key);
      break;
    }
  }
}

function updateGizmoForFace(faceKey) {
  if (!transformControl.gizmo) return;

  let desiredAxis = "";
  if (faceKey === "right" || faceKey === "left") {
    desiredAxis = "X";
  } else if (faceKey === "top" || faceKey === "bottom") {
    desiredAxis = "Y";
  } else if (faceKey === "front" || faceKey === "back") {
    desiredAxis = "Z";
  }

  const gizmo = transformControl.gizmo;
  for (const name in gizmo.handles) {
    gizmo.handles[name].visible = name.indexOf(desiredAxis) !== -1;
  }
  for (const name in gizmo.picker) {
    gizmo.picker[name].visible = name.indexOf(desiredAxis) !== -1;
  }
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -isometricSize * aspect;
  camera.right = isometricSize * aspect;
  camera.top = isometricSize;
  camera.bottom = -isometricSize;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

///////////////////////////////////////////
// DOM Injection: Insert Image in Description Div
///////////////////////////////////////////
window.addEventListener("DOMContentLoaded", () => {
  const descriptionDiv = document.getElementById("description");
  const imageElement = document.createElement("img");
  imageElement.src = "image.jpg"; // Ensure this path points to your image file
  imageElement.alt = "MoMA Unboxing Image";
  imageElement.style.width = "100%";
  imageElement.style.marginBottom = "10px";
  // Insert the image at the beginning of the description div
  descriptionDiv.insertBefore(imageElement, descriptionDiv.firstChild);
});
