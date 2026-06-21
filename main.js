/* global THREE */
'use strict';

// 教材内の事実データを1か所にまとめる。授業や資料更新時はここを修正する。
const data = {
  planeWeightTon: 442.3, // Boeing 747-8の最大離陸重量。プラスチック量 ÷ 442.3 で機数換算する。
  iconRepresentsPlanes: 1000, // 3Dを軽くするため、1モデルを1000機分として扱う。
  scales: {
    eightMt: {
      label: '年間800万トン',
      tons: 8_000_000,
      description: '2010年の研究をもとに、代表的な説明で使われることがある海への年間流入量です。'
    },
    elevenMt: {
      label: '年間1100万トン',
      tons: 11_000_000,
      description: '国連系資料で、現在海へ入るプラスチック量の目安として説明されることがあります。'
    },
    nineteenMt: {
      label: '水域への漏出1900万トン',
      tons: 19_000_000,
      description: 'UNEPが示す、湖・川・海などの水域へ漏出するプラスチックごみ推計の下限側です。'
    },
    twentyThreeMt: {
      label: '水域への漏出2300万トン',
      tons: 23_000_000,
      description: 'UNEPが示す、湖・川・海などの水域へ漏出するプラスチックごみ推計の上限側です。'
    }
  },
  plasticTypes: [
    { code: 'PET', name: 'ポリエチレンテレフタレート', examples: 'ペットボトル、食品容器', note: '透明で軽く、飲料容器に多い。' },
    { code: 'HDPE', name: '高密度ポリエチレン', examples: '洗剤ボトル、ポリタンク', note: '硬めで薬品に強いものが多い。' },
    { code: 'PVC', name: 'ポリ塩化ビニル', examples: 'パイプ、建材', note: '丈夫で建築材料にも使われる。' },
    { code: 'LDPE', name: '低密度ポリエチレン', examples: '袋、フィルム', note: 'やわらかく、薄い包装に使われる。' },
    { code: 'PP', name: 'ポリプロピレン', examples: '食品容器、キャップ', note: '熱に比較的強く、日用品にも多い。' },
    { code: 'PS', name: 'ポリスチレン', examples: '発泡スチロール、食品トレー', note: '軽く、発泡させると断熱性がある。' },
    { code: 'OTHER', name: 'その他・複合素材', examples: '複数素材の包装など', note: '材料が混ざると分別や再資源化が難しくなる。' }
  ],
  sources: [
    { text: 'Jambeck et al. (2015), Plastic waste inputs from land into the ocean. 2010年の陸由来流入量を約480万〜1270万トンと推計。', url: 'https://www.science.org/doi/10.1126/science.1260352' },
    { text: 'UNEPなどの資料で、海へ入るプラスチックは年間約1100万トンと説明されることがある。', url: 'https://www.unep.org/interactives/beat-plastic-pollution/' },
    { text: 'UNEP, From Pollution to Solution. 毎年1900万〜2300万トンが水域へ漏出しているとの説明。', url: 'https://www.unep.org/resources/pollution-solution-global-assessment-marine-litter-and-plastic-pollution' },
    { text: 'World Economic Forum / Ellen MacArthur Foundation (2016). 2050年に魚の重量を上回る可能性という条件つき予測。', url: 'https://www.ellenmacarthurfoundation.org/the-new-plastics-economy-rethinking-the-future-of-plastics' },
    { text: 'Boeing 747-8の最大離陸重量を約442.3トンとして換算。', url: 'https://www.boeing.com/commercial/747' }
  ]
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function formatPlanes(tons) {
  return Math.round(tons / data.planeWeightTon).toLocaleString('ja-JP');
}

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  return renderer;
}

function resizeRenderer(renderer, camera, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function initHeroScene() {
  const canvas = document.querySelector('#hero-canvas');
  if (!window.THREE || !canvas) return;

  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 4, 9);

  scene.add(new THREE.AmbientLight(0x9eeeff, 1.1));
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(3, 6, 4);
  scene.add(light);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 18, 28, 18),
    new THREE.MeshStandardMaterial({ color: 0x0f7db8, transparent: true, opacity: 0.72, roughness: 0.45 })
  );
  sea.rotation.x = -Math.PI / 2;
  scene.add(sea);

  const plasticGroup = new THREE.Group();
  scene.add(plasticGroup);
  const maxPieces = reducedMotion ? 24 : 90;
  const materials = [0xff6b8a, 0xffd166, 0xeefcff, 0x6ee7ff].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));

  for (let i = 0; i < maxPieces; i += 1) {
    // 箱・ボトル風円柱・袋風薄板を混ぜる。外部画像に頼らない表現。
    const kind = i % 3;
    const geometry = kind === 0 ? new THREE.BoxGeometry(.24, .08, .15) : kind === 1 ? new THREE.CylinderGeometry(.07, .07, .35, 10) : new THREE.BoxGeometry(.34, .025, .24);
    const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
    mesh.position.set((Math.random() - .5) * 16, .08 + Math.random() * 1.8, (Math.random() - .5) * 10);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData.seed = Math.random() * 10;
    plasticGroup.add(mesh);
  }

  function animate(time = 0) {
    const scrollRatio = Math.min(window.scrollY / window.innerHeight, 1);
    camera.position.y = 4 - scrollRatio * 2.1;
    camera.position.z = 9 - scrollRatio * 2.4;
    plasticGroup.children.forEach((piece, index) => {
      piece.visible = index < Math.max(8, Math.floor(maxPieces * (.18 + scrollRatio * .82)));
      if (!reducedMotion) {
        piece.position.y += Math.sin(time * .001 + piece.userData.seed) * .0018;
        piece.rotation.y += .004;
      }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resizeRenderer(renderer, camera, canvas.parentElement);
  window.addEventListener('resize', () => resizeRenderer(renderer, camera, canvas.parentElement));
  animate();
}

function createPlaneModel() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeefcff, roughness: 0.45 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x6ee7ff, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .9, 12), bodyMat);
  body.rotation.z = Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(.58, .035, .16), wingMat);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.2, .03, .22), wingMat);
  tail.position.x = -.38;
  tail.position.y = .1;
  group.add(body, wing, tail);
  return group;
}

function initPlaneScene() {
  const canvas = document.querySelector('#plane-canvas');
  if (!window.THREE || !canvas) return null;
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2.6, 7.5);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 4, 5);
  scene.add(light);
  const group = new THREE.Group();
  scene.add(group);

  function update(key) {
    group.clear();
    const item = data.scales[key];
    const actualPlanes = item.tons / data.planeWeightTon;
    const icons = Math.ceil(actualPlanes / data.iconRepresentsPlanes);
    const columns = 8;
    for (let i = 0; i < icons; i += 1) {
      const plane = createPlaneModel();
      plane.position.set((i % columns - (columns - 1) / 2) * .72, 1.25 - Math.floor(i / columns) * .45, 0);
      plane.scale.setScalar(.72);
      group.add(plane);
    }
  }

  function animate(time = 0) {
    if (!reducedMotion) group.rotation.y = Math.sin(time * .0005) * .12;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  resizeRenderer(renderer, camera, canvas.parentElement);
  window.addEventListener('resize', () => resizeRenderer(renderer, camera, canvas.parentElement));
  animate();
  return { update };
}

function initScaleControls(planeScene) {
  const label = document.querySelector('#scale-label');
  const count = document.querySelector('#plane-count');
  const description = document.querySelector('#scale-description');
  document.querySelectorAll('[data-scale-key]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.scaleKey;
      const item = data.scales[key];
      document.querySelectorAll('[data-scale-key]').forEach((tab) => tab.classList.toggle('is-active', tab === button));
      label.textContent = item.label;
      count.textContent = `約${formatPlanes(item.tons)}機分`;
      description.textContent = item.description;
      planeScene?.update(key);
    });
  });
  planeScene?.update('eightMt');
}

function renderPlasticTypes() {
  const root = document.querySelector('#plastic-types');
  root.innerHTML = data.plasticTypes.map((type) => `
    <article class="type-card">
      <div class="code" aria-hidden="true">${type.code}</div>
      <h3>${type.code}：${type.name}</h3>
      <p><strong>例：</strong>${type.examples}</p>
      <p>${type.note}</p>
    </article>
  `).join('');
}

function renderSources() {
  const root = document.querySelector('#source-list');
  root.innerHTML = data.sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noreferrer">${source.text}</a></li>`).join('');
}

// 初期化処理。3Dが失敗しても本文は読めるよう、各処理は独立させる。
renderPlasticTypes();
renderSources();
initHeroScene();
initScaleControls(initPlaneScene());
