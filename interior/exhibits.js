/* Shared display construction for the fourteen indoor courses. */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const assetRoot = new URL('./art/', document.currentScript.src);
const tower = location.pathname.match(/([a-z]+)-3d\//)?.[1];
const catalog = window.DenglouExhibits[tower];
const font = '"Kaiti SC", KaiTi, "Noto Serif CJK SC", SimSun, serif';
const standard = (color, roughness, metalness = 0) =>
  new T.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.24 });
const walnut = standard(0x936344, 0.53);
const brass = standard(0xa88752, 0.38, 0.52);
const lacquer = standard(0x542a23, 0.51);
const bronze = standard(0x696949, 0.58, 0.62);
const porcelain = standard(0xc1d7bc, 0.26);
const ceramicBlue = standard(0x3c6675, 0.43);
const stone = standard(0x28282c, 0.76);
const silk = standard(0x68706b, 0.85);
const paper = standard(0xe3cf9f, 0.91);
const rosePaper = standard(0xa7525b, 0.92);
const fabric = standard(0xa68852, 0.87);

function box(group, w, h, d, material, x = 0, y = 0, z = 0) {
  return mesh(group, new T.BoxGeometry(w, h, d), material, x, y, z);
}

function mesh(group, geometry, material, x = 0, y = 0, z = 0) {
  const object = new T.Mesh(geometry, material);
  object.position.set(x, y, z);
  group.add(object);
  return object;
}

function finishMaterials(materials) {
  const grain = H.canvasTex(512, 256, (g, w, h) => {
    const random = H.rng(605);
    g.fillStyle = '#926445';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) {
      const x = random() * w, y = random() * h, length = 10 + random() * 270;
      const curve = 0.4 + random() * 3;
      g.strokeStyle = i % 3 ? 'rgba(49,26,18,.15)' : 'rgba(224,178,127,.19)';
      g.lineWidth = 0.35 + random() * 1.3;
      for (const offset of [-w, 0]) {
        g.beginPath();
        g.moveTo(x + offset, y);
        g.bezierCurveTo(x + offset + length / 3, y - curve, x + offset + length * 0.7, y + curve, x + offset + length, y);
        g.stroke();
      }
    }
  });
  walnut.map = grain;
  for (const [key, color] of [['wood', 0x8a6550], ['beam', 0x80655a]]) {
    materials[key].color.setHex(color);
    materials[key].map = grain;
    materials[key].roughness = 0.61;
    materials[key].needsUpdate = true;
  }
  if (materials.floor) materials.floor.roughness = 0.61;
  const weave = H.canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#b8b09d';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 128; i += 4) {
      g.fillStyle = 'rgba(45,39,34,.14)';
      g.fillRect(i, 0, 1, h);
      g.fillStyle = 'rgba(255,251,231,.22)';
      g.fillRect(0, i, w, 1);
    }
    g.strokeStyle = 'rgba(71,65,56,.24)';
    for (const x of [0, 64, 128]) for (const y of [0, 64, 128]) {
      g.beginPath();
      g.moveTo(x, y - 23);
      g.quadraticCurveTo(x + 9, y - 9, x + 23, y);
      g.quadraticCurveTo(x + 9, y + 9, x, y + 23);
      g.quadraticCurveTo(x - 9, y + 9, x - 23, y);
      g.quadraticCurveTo(x - 9, y - 9, x, y - 23);
      g.stroke();
    }
  }, true, [3, 5]);
  silk.map = weave;
  materials.silk.map = weave;
  materials.silk.needsUpdate = true;
  materials.gilt.color.setHex(0xb18d54);
  materials.gilt.metalness = 0.58;
  materials.gilt.roughness = 0.4;
  materials.gilt.emissiveIntensity = 0.19;
  materials.lantern.emissiveIntensity = 1.3;
}

function frame(group, w, h, front = 0.125) {
  const lip = Math.min(0.085, w * 0.025);
  for (const direction of [-1, 1]) {
    box(group, w + lip * 4, lip, 0.065, walnut, 0, direction * (h / 2 + lip * 1.4), front - 0.009);
    box(group, lip, h + lip * 2, 0.065, walnut, direction * (w / 2 + lip * 1.4), 0, front - 0.009);
    box(group, w + lip, lip * 0.18, 0.026, brass, 0, direction * (h / 2 + lip * 0.29), front + 0.005);
    box(group, lip * 0.18, h + lip, 0.026, brass, direction * (w / 2 + lip * 0.29), 0, front + 0.005);
  }
}

function scroll(group, w, h, margin) {
  const rodY = -h / 2 - margin;
  for (const direction of [-1, 1]) {
    const cap = mesh(group, new T.CylinderGeometry(0.049, 0.049, 0.07, 12), brass,
      direction * (w / 2 + 0.15), rodY, 0.02);
    cap.rotation.z = Math.PI / 2;
    box(group, 0.014, h + 2 * margin, 0.009, fabric, direction * (w / 2 + 0.044), 0, 0.016);
  }
}

function quoteScroll(name, palette, first, second, seed) {
  return H.canvasTex(512, 1024, (g, w, h) => {
    const random = H.rng(seed);
    const silkColor = g.createLinearGradient(0, 0, w, h);
    silkColor.addColorStop(0, '#e3d5b6');
    silkColor.addColorStop(0.52, '#eee3ca');
    silkColor.addColorStop(1, '#cdbb94');
    g.fillStyle = silkColor;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(85,63,39,0.15)';
    for (let i = 0; i < 1900; i++) {
      const x = random() * w, y = random() * h;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 2 + random() * 13, y + 0.7);
      g.stroke();
    }
    g.fillStyle = palette[0];
    g.globalAlpha = 0.68;
    g.fillRect(0, 0, w, 58);
    g.fillRect(0, h - 102, w, 102);
    g.globalAlpha = 1;
    g.fillStyle = '#6b5440';
    g.fillRect(0, 58, w, 4);
    g.fillRect(0, h - 104, w, 4);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = Math.min(76, 735 / (Math.max(first.length, second.length) * 1.19));
    g.font = size + 'px ' + font;
    g.fillStyle = '#30251c';
    for (const [line, x] of [[first, 344], [second, 222]]) {
      [...line].forEach((character, index) => g.fillText(character, x, 152 + index * size * 1.19));
    }
    g.fillStyle = '#8e3629';
    g.font = '38px ' + font;
    [...name].forEach((character, index) => g.fillText(character, 102, 639 + index * 44));
  });
}

function joinery(group, w, d) {
  box(group, w + 0.06, 0.065, d + 0.025, walnut, 0, 0.83);
  box(group, w - 0.12, 0.14, 0.075, lacquer, 0, 0.734, d / 2 - 0.07);
  box(group, w - 0.19, 0.055, 0.065, walnut, 0, 0.21, d / 2 - 0.07);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(group, 0.093, 0.8, 0.093, walnut, sx * (w / 2 - 0.12), 0.44, sz * (d / 2 - 0.075));
    box(group, 0.14, 0.05, 0.14, lacquer, sx * (w / 2 - 0.12), 0.053, sz * (d / 2 - 0.075));
  }
}

function lathe(group, profile, material, x, y, z) {
  return mesh(group, new T.LatheGeometry(profile.map(([r, height]) => new T.Vector2(r, height)), 24), material, x, y, z);
}

function model(group, kind, x, y, z) {
  const g = new T.Group();
  g.position.set(x, y, z);
  group.add(g);
  if (kind === 'boat' || kind === 'redBoat') {
    const hull = new T.Shape();
    hull.moveTo(-0.35, 0.13);
    hull.quadraticCurveTo(-0.29, 0.025, -0.12, 0.025);
    hull.lineTo(0.22, 0.025);
    hull.quadraticCurveTo(0.31, 0.06, 0.34, 0.14);
    hull.lineTo(-0.35, 0.13);
    mesh(g, new T.ExtrudeGeometry(hull, { depth: 0.15, bevelSize: 0.009, bevelThickness: 0.01, bevelSegments: 1 }), walnut, 0, 0, -0.075);
    if (kind === 'redBoat') {
      box(g, 0.5, 0.025, 0.175, walnut, 0.01, 0.138);
      box(g, 0.42, 0.144, 0.137, lacquer, 0.018, 0.213);
      for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
        box(g, 0.042, 0.057, 0.008, paper, -0.145 + i * 0.063, 0.236, side * 0.073);
        box(g, 0.005, 0.057, 0.012, lacquer, -0.145 + i * 0.063, 0.236, side * 0.073);
      }
      const canopy = new T.Shape();
      canopy.moveTo(-0.096, 0.282);
      canopy.quadraticCurveTo(0, 0.36, 0.096, 0.282);
      canopy.lineTo(0.096, 0.27);
      canopy.quadraticCurveTo(0, 0.335, -0.096, 0.27);
      canopy.closePath();
      mesh(g, new T.ExtrudeGeometry(canopy, { depth: 0.475, bevelEnabled: false }), stone, -0.22).rotation.y = Math.PI / 2;
      return g;
    }
    box(g, 0.13, 0.072, 0.13, lacquer, 0.19, 0.17);
    box(g, 0.22, 0.017, 0.15, walnut, 0.17, 0.216);
    box(g, 0.014, 0.41, 0.014, lacquer, -0.13, 0.33);
    const sail = new T.Shape();
    sail.moveTo(-0.115, 0.49);
    sail.quadraticCurveTo(0.073, 0.41, 0.146, 0.25);
    sail.lineTo(-0.115, 0.21);
    sail.lineTo(-0.115, 0.49);
    const sailMaterial = paper.clone();
    sailMaterial.side = T.DoubleSide;
    mesh(g, new T.ShapeGeometry(sail), sailMaterial);
    for (let i = 0; i < 3; i++) box(g, 0.23 - i * 0.057, 0.008, 0.01, fabric, -0.003 - i * 0.027, 0.27 + i * 0.063, 0.009).rotation.z = 0.11;
  } else if (kind === 'paper' || kind === 'ink') {
    for (let i = 0; i < 4; i++) box(g, 0.38, 0.008, 0.25, kind === 'paper' && tower === 'wangjianglou' ? rosePaper : paper, i * 0.012 - 0.13, 0.013 + i * 0.009, 0.03).rotation.y = i * 0.027;
    box(g, 0.2, 0.043, 0.142, stone, 0.2, 0.03, 0.04);
    box(g, 0.145, 0.005, 0.095, lacquer, 0.2, 0.054, 0.04);
    const brush = mesh(g, new T.CylinderGeometry(0.009, 0.009, 0.3, 9), walnut, 0, 0.059, -0.086);
    brush.rotation.z = Math.PI / 2;
    mesh(g, new T.SphereGeometry(0.017, 9, 6), stone, -0.164, 0.059, -0.086).scale.set(2.1, 0.7, 0.7);
    box(g, 0.085, 0.083, 0.07, lacquer, 0.27, 0.042, -0.075);
  } else if (kind === 'pipa') {
    const body = mesh(g, new T.SphereGeometry(0.115, 20, 12), walnut, -0.08, 0.138);
    body.scale.set(0.82, 1.28, 0.34);
    mesh(g, new T.SphereGeometry(0.1, 20, 12), paper, -0.08, 0.14, 0.026).scale.set(0.81, 1.31, 0.09);
    box(g, 0.065, 0.27, 0.045, lacquer, -0.08, 0.344);
    box(g, 0.08, 0.067, 0.047, walnut, -0.08, 0.49);
    for (let i = 0; i < 5; i++) box(g, 0.06, 0.008, 0.014, brass, -0.08, 0.225 + i * 0.035, 0.025);
    for (let i = 0; i < 4; i++) box(g, 0.002, 0.335, 0.002, stone, -0.096 + i * 0.01, 0.274, 0.036);
    for (const dx of [-0.04, 0.04]) box(g, 0.036, 0.014, 0.014, walnut, -0.08 + dx, 0.49);
  } else if (kind === 'bronze') {
    lathe(g, [[0,0.065],[0.08,0.067],[0.132,0.112],[0.16,0.175],[0.15,0.222],[0.126,0.233],[0.162,0.259],[0.154,0.276],[0.132,0.273],[0.106,0.20],[0,0.143]], bronze, 0, 0, 0);
    for (const i of [0, 1, 2]) {
      const angle = i * Math.PI * 2 / 3;
      mesh(g, new T.CylinderGeometry(0.037, 0.025, 0.11, 10), bronze, Math.cos(angle) * 0.105, 0.066, Math.sin(angle) * 0.105);
    }
    for (const dx of [-0.162, 0.162]) mesh(g, new T.TorusGeometry(0.048, 0.012, 8, 18), bronze, dx, 0.261);
  } else {
    const glaze = kind === 'wine' ? ceramicBlue : porcelain;
    lathe(g, [[0,0],[0.082,0],[0.084,0.026],[0.133,0.075],[0.158,0.169],[0.151,0.225],[0.09,0.298],[0.073,0.34],[0.073,0.38],[0.089,0.395],[0.087,0.411],[0.066,0.412],[0.062,0.358],[0.052,0.295],[0,0.19]], glaze, -0.08, 0.008, -0.018);
    for (const [dx, dz] of [[0.16, 0.103], [0.27, -0.04]]) {
      lathe(g, [[0,0],[0.039,0],[0.04,0.015],[0.069,0.046],[0.078,0.082],[0.069,0.083],[0.058,0.05],[0,0.021]], glaze, dx, 0, dz);
    }
  }
  return g;
}

function titleTexture(title, detail) {
  return H.canvasTex(768, 312, (g, w, h) => {
    g.fillStyle = '#3d3126';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e9dbb8';
    g.fillRect(8, 8, w - 16, h - 16);
    g.strokeStyle = '#a28450';
    g.strokeRect(19, 19, w - 38, h - 38);
    g.fillStyle = '#69342a';
    g.font = 'bold 42px ' + font;
    g.fillText(title, 42, 76);
    g.fillRect(43, 105, 92, 3);
    g.fillStyle = '#40372d';
    g.font = '33px ' + font;
    let line = '', y = 161;
    for (const character of detail) {
      if (g.measureText(line + character).width > w - 84 && !'，。、；？！）》'.includes(character)) {
        g.fillText(line, 42, y);
        line = '';
        y += 45;
      }
      line += character;
    }
    g.fillText(line, 42, y);
  });
}

function standPosition(room, materials) {
  room.grp.updateWorldMatrix(true, true);
  const origin = room.grp.getWorldPosition(new T.Vector3());
  const center = room.view.target.x - origin.x;
  const depth = room.view.pos.z - origin.z - room.zb;
  const width = room.ax || room.aw, side = Math.min(3, width * 0.61, depth * 0.23);
  const obstacles = room.grp.children.filter(object =>
    object.material !== materials.floor && object.material !== materials.ceil &&
    object.material !== materials.wallIn && object.material !== materials.bandIn &&
    object.material !== materials.beam
  ).map(object => new T.Box3().setFromObject(object));
  const candidates = [[side, 0.41], [side, 0.52], [-side, 0.41], [side * 0.71, 0.6], [-side, 0.52]];
  let best, smallest = Infinity;
  for (const [offset, proportion] of candidates) {
    const x = center + offset, z = room.zb + Math.min(4.0, depth * proportion);
    const bounds = new T.Box3(
      new T.Vector3(origin.x + x - 0.89, origin.y + room.y0 + 0.18, origin.z + z - 0.39),
      new T.Vector3(origin.x + x + 0.89, origin.y + room.y0 + 1.16, origin.z + z + 0.39)
    );
    const collisions = obstacles.filter(obstacle => obstacle.intersectsBox(bounds)).length;
    if (collisions < smallest) {
      best = [x, z];
      smallest = collisions;
    }
  }
  return best;
}

function galleryStand(room, item, materials) {
  const base = new T.Group();
  const [x, z] = standPosition(room, materials);
  base.position.set(x, room.y0 + 0.04, z);
  base.rotation.y = -0.13;
  room.grp.add(base);
  joinery(base, 1.65, 0.59);
  box(base, 1.68, 0.07, 0.67, walnut, 0, 0.891);
  box(base, 0.68, 0.014, 0.4, silk, 0.41, 0.933);
  model(base, item[2], 0.4, 0.948, 0);
  const label = new T.Group();
  label.position.set(-0.33, 1.059, 0.16);
  label.rotation.x = -0.56;
  base.add(label);
  const map = titleTexture(item[0], item[1]);
  box(label, 0.861, 0.35, 0.035, walnut);
  mesh(label, new T.PlaneGeometry(0.83, 0.337), new T.MeshBasicMaterial({ map }), 0, 0, 0.02);
  return base;
}

const paintingDetails = {
  '1948.140': [0.69, 0.08, 0.095, 0.82],
  '1954.581': [0.75, 0.14, 0.22, 0.75],
  '1959.46': [0.66, 0.025, 0.31, 0.95],
  '1963.515': [0.906, 0.025, 0.045, 0.95],
  '1978.68': [0.205, 0.08, 0.59, 0.84],
  '1979.54': [0.256, 0.025, 0.18, 0.95]
};

const studyMounts = {
  qingchuange: ['#454d44', '#dfd0a8'],
  tengwangge: ['#524139', '#f0dcad'],
  yuejianglou: ['#344759', '#e9dfc0'],
  yueyanglou: ['#638074', '#faf0ce'],
  penglaige: ['#354e50', '#ecd8af'],
  daguanlou: ['#45526b', '#eed9a8']
};

function loadPainting(mesh, entry) {
  const [id, name, description, presentation] = entry;
  const material = mesh.material;
  const previous = material.map;
  const image = new Image();
  image.onload = () => {
    const size = mesh.geometry.parameters;
    const [sx, sy, sw, sh] = paintingDetails[id] || [0, 0, 1, 1];
    const sourceWidth = image.naturalWidth * sw, sourceHeight = image.naturalHeight * sh;
    const sourceRatio = sourceWidth / sourceHeight;
    const nativeRatio = size.width / size.height;
    if (nativeRatio > 1.25 && sourceRatio < 0.85) {
      mesh.parent.scale.x = Math.max(0.53, (sourceRatio + 0.38) / nativeRatio);
    }
    const ratio = nativeRatio * mesh.parent.scale.x;
    const w = Math.min(1920, Math.round(1070 * ratio)), h = Math.round(w / ratio);
    const mural = id === 'huanghe-mural' || presentation === 'surface';
    const texture = H.canvasTex(w, h, g => {
      if (mural) {
        g.drawImage(image, 0, 0, w, h);
        return;
      }
      const [mountColor, textColor] = (presentation === 'study' && studyMounts[tower]) || ['#d9c9aa', '#36281d'];
      const border = Math.min(w, h) * 0.045, strip = Math.min(w, h) * 0.15;
      g.fillStyle = mountColor;
      g.fillRect(0, 0, w, h);
      const scale = Math.min((w - border * 2) / sourceWidth, (h - border * 2 - strip) / sourceHeight);
      const iw = sourceWidth * scale, ih = sourceHeight * scale;
      const x = (w - iw) / 2, y = (h - strip - ih) / 2;
      g.fillStyle = '#7d6847';
      g.fillRect(x - 2, y - 2, iw + 4, ih + 4);
      g.drawImage(image, image.naturalWidth * sx, image.naturalHeight * sy, sourceWidth, sourceHeight, x, y, iw, ih);
      const textSize = Math.max(19, Math.min(w * 0.048, strip * 0.4));
      g.textAlign = 'center';
      g.fillStyle = textColor;
      g.font = 'bold ' + textSize + 'px ' + font;
      g.fillText('《' + name + '》' + (paintingDetails[id] ? '（局部）' : ''), w / 2, h - strip * 0.62, w - border * 2);
      g.font = Math.round(textSize * 0.69) + 'px sans-serif';
      const attribution = presentation === 'study' ? '课件绘制' : '克利夫兰艺术博物馆';
      g.fillText(description + '  /  ' + attribution, w / 2, h - strip * 0.23, w - border * 2);
    });
    material.map = texture;
    material.emissiveMap = texture;
    const originalStudy = presentation === 'surface' || presentation === 'study';
    material.color.setHex(originalStudy ? 0xaaa397 : 0xc8bda9);
    material.emissiveIntensity = originalStudy ? 0.065 : 0.19;
    material.needsUpdate = true;
    mesh.userData.museumImage = id;
  };
  const asset = document.createElement('script');
  const failed = () => {
    if (!previous) mesh.parent.visible = false;
    asset.remove();
  };
  image.onerror = failed;
  asset.onerror = failed;
  asset.onload = () => {
    if (asset.artwork) image.src = asset.artwork;
    else failed();
    asset.remove();
  };
  // Data URLs keep gallery textures readable in WebGL when a course is opened from disk.
  asset.src = new URL(id + '.js', assetRoot).href;
  document.head.append(asset);
}

function addCompanion(room, entry, side, depth, width, height) {
  const mount = new T.Group();
  const origin = room.grp.getWorldPosition(new T.Vector3());
  const center = room.view.target.x - origin.x;
  const halfWidth = room.ax || room.aw;
  mount.position.set(center + side * (halfWidth - 0.57), room.y0 + room.H * 0.52, room.zb + (room.view.pos.z - origin.z - room.zb) * depth);
  mount.rotation.y = -side * Math.PI * 0.39;
  room.grp.add(mount);
  box(mount, width + 0.14, height + 0.14, 0.13, walnut);
  const picture = mesh(mount, new T.PlaneGeometry(width, height), standard(0xd9c9aa, 0.8), 0, 0, 0.125);
  frame(mount, width, height);
  return () => loadPainting(picture, entry);
}

const companions = {
  huanghelou: [0, 'craneScroll', 1, 0.52, 2.15, 2.35],
  tengwangge: [2, 'butterfly', 1, 0.56, 1.26, 1.42],
  yuejianglou: [1, 'qinhuai', -1, 0.64, 1.8, 1.63],
  wanghulou: [2, 'lotus', 1, 0.45, 1.0, 1.36],
  penglaige: [0, 'immortal', 1, 0.44, 1.2, 1.74]
};

function upgrade(interior) {
  if (!catalog) return;
  finishMaterials(interior.MI);
  const artByTexture = new Map();
  for (const [key, entry] of Object.entries(catalog.art)) {
    const texture = interior.PIC[key];
    if (texture) artByTexture.set(texture, entry);
  }
  const lazyLoads = interior.INSIDE.map((room, index) => {
    const actions = [];
    room.grp.traverse(object => {
      if (!object.isMesh || object.geometry.type !== 'PlaneGeometry' || !object.material.map) return;
      const entry = artByTexture.get(object.material.map);
      if (entry) actions.push(() => loadPainting(object, entry));
    });
    const companion = companions[tower];
    if (companion && companion[0] === index) {
      const [ , key, side, depth, w, h] = companion;
      actions.push(addCompanion(room, catalog.art[key], side, depth, w, h));
    }
    const item = catalog.rooms[index];
    if (item[2]) {
      room.exhibit = galleryStand(room, item, interior.MI);
      room.exhibit.visible = false;
    }
    return actions;
  });
  const enter = interior.enter;
  let visibleExhibit;
  interior.enter = function (index) {
    enter(index);
    if (visibleExhibit) visibleExhibit.visible = false;
    visibleExhibit = interior.INSIDE[index]?.exhibit;
    if (visibleExhibit) visibleExhibit.visible = true;
    const actions = lazyLoads[index];
    if (actions) actions.splice(0).forEach(load => load());
  };
}

H.exhibits = { frame, scroll, quoteScroll, joinery, upgrade };
})();
