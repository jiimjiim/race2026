import { Box3, Clock, CylinderGeometry, DirectionalLight, GridHelper, Group, HemisphereLight, Mesh, MeshStandardMaterial, PerspectiveCamera, RingGeometry, SRGBColorSpace, Scene, Vector3, WebGLRenderer } from 'three';
import { buildCar, disposeTree } from './car.js';
import { buildPartPreview } from './parts3d.js';

export class Garage {
  constructor(container) {
    this.container = container;
    this.renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(34, 1, 0.1, 60);
    this.camera.position.set(5.4, 3.1, 6.6);

    const hemi = new HemisphereLight(0xe8f2ff, 0x4a4030, 2.3);
    this.scene.add(hemi);
    const key = new DirectionalLight(0xfff3d8, 3.4);
    key.position.set(5, 8, 6);
    this.scene.add(key);
    const rim = new DirectionalLight(0x9fc8ff, 2.2);
    rim.position.set(-6, 4, -5);
    this.scene.add(rim);
    const fill = new DirectionalLight(0xffd9a8, 1.4);
    fill.position.set(-4, 2, 6);
    this.scene.add(fill);

    const floor = new Mesh(
      new CylinderGeometry(4.3, 4.45, 0.06, 48),
      new MeshStandardMaterial({ color: 0x1e2427, roughness: 0.72, metalness: 0.25 })
    );
    floor.position.y = -0.025;
    this.scene.add(floor);

    const ring = new Mesh(
      new RingGeometry(3.48, 3.62, 48),
      new MeshStandardMaterial({ color: 0xb8c6ba, emissive: 0x364a3e, roughness: 0.4 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    const innerRing = new Mesh(
      new RingGeometry(2.38, 2.44, 48),
      new MeshStandardMaterial({ color: 0x4c5a54, roughness: 0.6 })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.011;
    this.scene.add(innerRing);

    const grid = new GridHelper(8.4, 24, 0x3f4a45, 0x2b3330);
    grid.position.y = 0.012;
    this.scene.add(grid);

    this.turntable = new Group();
    this.scene.add(this.turntable);
    this.car = null;
    this.kind = 'car';
    this.baseY = 0.03;
    this.spin = true;
    this.angle = -0.7;
    this.dragging = false;
    this.lastX = 0;

    this.camera.lookAt(0, 0.7, 0);
    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(container);
    this.resize();

    const el = this.renderer.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', (e) => { this.dragging = true; this.spin = false; this.lastX = e.clientX; el.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', this.onUp = () => { this.dragging = false; el.style.cursor = 'grab'; });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.angle += (e.clientX - this.lastX) * 0.012;
      this.lastX = e.clientX;
    });
    el.addEventListener('dblclick', () => { this.spin = true; });

    this.clock = new Clock();
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }
  resize() {
    const w = this.container.clientWidth || 300;
    const h = this.container.clientHeight || 200;
    this.renderer.setSize(Math.max(1, Math.round(w * 0.7)), Math.max(1, Math.round(h * 0.7)), false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  clearModel() {
    if (!this.car) return;
    this.turntable.remove(this.car);
    disposeTree(this.car);
    this.car = null;
  }
  frameObject(radius, centerY, margin = 3.4) {
    const dist = Math.max(3.0, radius * margin);
    this.camera.position.set(dist * 0.88, centerY + dist * 0.42, dist * 0.82);
    this.camera.lookAt(0, centerY, 0);
  }
  setSpec(spec) {
    this.clearModel();
    if (!spec) return;
    this.kind = 'car';
    this.baseY = 0.03;
    this.angle = -0.7;
    this.car = buildCar(spec);
    this.car.position.y = this.baseY;
    this.turntable.add(this.car);
    const box = new Box3().setFromObject(this.car);
    const maxY = Math.max(2.2, box.max.y);
    const tall = Math.max(0, maxY - 2.1);
    this.camera.position.set(5.4 + tall * 0.95, 3.1 + tall * 0.8, 6.6 + tall * 0.95);
    this.camera.lookAt(0, Math.max(0.7, maxY * 0.38), 0);
  }
  setPart(cat, item) {
    this.clearModel();
    if (!item) return;
    this.kind = 'part';
    this.baseY = 0.03;
    this.angle = 0.8;
    this.car = buildPartPreview(cat, item);
    this.car.position.y = this.baseY;
    this.turntable.add(this.car);
    const box = new Box3().setFromObject(this.car);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const radius = Math.max(size.x, size.z, size.y * 1.25) * 0.5;
    this.frameObject(Math.max(0.85, radius), Math.max(0.48, center.y), 3.5);
  }
  tick() {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.spin) this.angle += dt * 0.45;
    this.turntable.rotation.y = this.angle;
    if (this.car) this.car.position.y = this.baseY + Math.sin(performance.now() * 0.002) * (this.kind === 'part' ? 0.0015 : 0.005);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    window.removeEventListener('pointerup', this.onUp);
    if (this.car) disposeTree(this.car);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
