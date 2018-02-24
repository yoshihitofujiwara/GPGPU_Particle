/*==========================================================================
  Libs
==========================================================================*/
window.$ = window.jQuery = require("jquery");
window.dat = require("dat.gui").default;
window.Stats = require("stats.js");
window.THREE = require("three");
require("three/examples/js/controls/OrbitControls.js");
require("./libs/GPUComputationRenderer.js");
require("./libs/amp-4.1.0.min.js");


/*==========================================================================
  module
==========================================================================*/
import Render from "./utils/Render";


/*==========================================================================
  class
==========================================================================*/
/**
 * @calss GPGPUParticles
 */
class GPGPUParticles {
  /**
   * constructor
   */
  constructor() {
    this.render = new Render($("#canvas_container"));

    // テクスチャーに使うパラメーター類
    // テクスチャーサイズは2の累乗: https://goo.gl/3ASCkR
    this.power = 8;
    this.params = {
      txSize: Math.pow(2, this.power),
      particles: Math.pow(2, this.power) * Math.pow(2, this.power),
      power: this.power
    };

    // GPUレンダラー生成
    this.gpuCompute = new GPUComputationRenderer(this.params.txSize, this.params.txSize, this.render.renderer);

    // 座標と加速度のテクスチャ変数格納用オブジェクト
    this.positionVar = null;
    this.velocityVar = null;

    // 描画用uniforms変数格納用オブジェクト
    this.uniforms = {};

    // init call
    this.setup();
  }


  /**
   * setup
   */
  setup() {
    this.setGui();
    this.draw();
    this.render.start();

    // update
    this.render.event.on("update", () => {
      // if(!this.velocityVar.material.uniforms.mouseFlag.value){
      // this.velocityVar.material.uniforms.velocity.value *= 0.95;
      // }

      // GPU計算処理
      this.gpuCompute.compute();

      // GPU計算処理結果をuniforms変数に渡す
      this.uniforms.u_texturePosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVar).texture;
      this.uniforms.u_textureVelocity.value = this.gpuCompute.getCurrentRenderTarget(this.velocityVar).texture;
      this.uniforms.u_count.value += 1;
    });

    // マウスイベント設定（uniformsに値を渡す）
    this.render.$container
      .on("mousedown touchstart", (e) => {
        this.velocityVar.material.uniforms.mouseFlag.value = true;
        this.velocityVar.material.uniforms.velocity.value = 1.0;
      })
      .on("mousemove touchmove", (e) => {
        // 座標値を-1.0 to 1.0に変換
        let v2 = new THREE.Vector2(e.offsetX / this.render.width * 2 - 1, e.offsetY / this.render.height * -2 + 1);
        this.velocityVar.material.uniforms.mouse.value = v2;
      })
      .on("mouseup touchend", (e) => {
        this.velocityVar.material.uniforms.mouseFlag.value = false;
      });
  }


  /**
   * draw
   */
  draw() {
    // 座標保管用テクスチャ
    let texturePosition = this.gpuCompute.createTexture();

    // 移動計算用テクスチャ
    let textureVelocity = this.gpuCompute.createTexture();

    // textureのrgbaに必要な情報（位置・加速度）を埋める
    let pAry = texturePosition.image.data;
    let vAry = textureVelocity.image.data;
    // let _amount = 0.5; // 加速度の係数（適当に設定）

    let pNum = 0;
    let vNum = 0;

    for (let i = 0; i < this.params.txSize; i++) {
      for (let j = 0; j < this.params.txSize; j++) {
        // 座標
        let a1 = i / this.params.txSize * 2.0 - 1.0,
          a2 = j / this.params.txSize * 2.0 - 1.0;
        // 座標保管用
        pAry[pNum++] = a1;
        pAry[pNum++] = a2;
        pAry[pNum++] = 0;
        pAry[pNum++] = 0;

        // 移動計算用
        vAry[vNum++] = 0;
        vAry[vNum++] = 0;
        vAry[vNum++] = 0;
        vAry[vNum++] = 0;
      }
    }

    // shaderプログラムのアタッチ(テクスチャ変数を追加)
    this.velocityVar = this.gpuCompute.addVariable("textureVelocity", require("../shader/velocity.frag"), textureVelocity);
    this.positionVar = this.gpuCompute.addVariable("texturePosition", require("../shader/position.frag"), texturePosition);

    // 変数の依存関係を追加する
    let variables = [this.positionVar, this.velocityVar];
    this.gpuCompute.setVariableDependencies(this.velocityVar, variables);
    this.gpuCompute.setVariableDependencies(this.positionVar, variables);

    // gpuCompute 初期化（エラーがあればエラー文字列が返ってくる）
    let error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }

    // ##### パーティクル設定 #####
    // 描画用パーティクルのバッファ生成
    let geometry = new THREE.BufferGeometry();

    // パーティクルポジション座標情報(*xyz)格納用Float32Array生成
    let positions = new Float32Array(this.params.particles * 3);

    // パーティクルuv座標格納用(*xy)Float32Array生成(テクスチャから座標取得する時に使用) 
    let uvs = new Float32Array(this.params.particles * 2);

    let div = this.params.txSize - 1,
      p = 0,
      u = 0;

    for (let i = 0; i < this.params.txSize; i++) {
      for (let j = 0; j < this.params.txSize; j++) {
        // パーティクル x,y,z 座標
        positions[p++] = 0;
        positions[p++] = 0;
        positions[p++] = 0;

        // テクスチャ x,y座標
        uvs[u++] = i / (this.params.txSize - 1);
        uvs[u++] = j / (this.params.txSize - 1);
      }
    }

    // attributes追加
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    // uniforms変数をリセット
    this.setUniforms();

    // uniform: shaderにデータ受け渡し用
    let material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: require("../shader/defaults.vert"),
      fragmentShader: require("../shader/defaults.frag")
    });


    this.render.scene.remove(this.render.scene.children[0]);

    let points = new THREE.Points(geometry, material);
    this.render.scene.add(points);
  }


  /**
   * setUniforms uniforms変数に初期値をセット
   */
  setUniforms() {
    // 加速度計算用uniforms変数
    this.velocityVar.material.uniforms.mouse = { type: "vec2", value: new THREE.Vector2() };
    this.velocityVar.material.uniforms.mouseFlag = { type: "bool", value: false };
    this.velocityVar.material.uniforms.velocity = { type: 'f', value: 1 };

    // 描画用shaderのuniforms変数
    this.uniforms = {
      u_texturePosition: { type: "t", value: null },
      u_textureVelocity: { type: "t", value: null },
      u_pintsize: { type: "f", value: window.devicePixelRatio },
      u_count: { type: "f", value: 0.0 }
    };
  }


  /**
   * setGui: デバッグ用GUI設定
   */
  setGui() {
    this.render.gui.params.particles = this.params.particles + "";

    let el = this.render.gui.add(this.render.gui.params, "particles").domElement,
      $el = $(el).find("input").attr({ readonly: !0 });

    let timerId;
    this.render.gui.add(this.params, "power").step(1).min(1).max(10).onChange(() => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (this.params.power != this.power) {
          this.power = this.params.power;

          let size = Math.pow(2, this.power);
          this.params.txSize = size;
          this.params.particles = size * size;
          $el.val(this.params.particles);
          this.draw();
        }
      }, 200);
    });
  }
}


/*==========================================================================
  DOM READY
==========================================================================*/
$(function () {
  new GPGPUParticles();
});
